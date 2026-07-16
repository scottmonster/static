#!/usr/bin/env -S bun run --install=fallback

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { PDFArray, PDFDocument, PDFName, PDFString } from 'pdf-lib';
const pdfOutputDirectory = resolve(import.meta.dir, '..', 'pdfs');
const htmlOutputDirectory = resolve(import.meta.dir, '..', 'pdfs');

function usage() {
	console.error(`Usage: scripts/add-pdf-link.js <url> <input_file> <output_file> [--title <page_title>]

Adds an invisible full-page link to every page in a PDF, or creates a linked
one-page PDF from a PNG or JPEG image. Output is written inside pdfs/.

Options:
  -t, --title <page_title>  Set the PDF document title`);
}

function parseArguments(args) {
	let title;
	const positional = [];

	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];

		if (argument === '-t' || argument === '--title') {
			title = args[++index];
			if (!title) throw new Error(`${argument} requires a title.`);
		} else if (argument === '--help' || argument === '-h') {
			usage();
			process.exit(0);
		} else {
			positional.push(argument);
		}
	}

	if (positional.length !== 3) {
		throw new Error('Expected a URL, input file, and output file.');
	}

	const [url, inputPath, outputFile] = positional;
	try {
		new URL(url);
	} catch {
		throw new Error(`Invalid URL: ${url}`);
	}

	const outputPath = resolve(pdfOutputDirectory, outputFile);
	const outputRelativePath = relative(pdfOutputDirectory, outputPath);
	if (outputRelativePath.startsWith('..') || isAbsolute(outputRelativePath)) {
		throw new Error('Output file must be inside the pdfs directory.');
	}

	return { url, inputPath, outputPath, title };
}

function addFullPageUriLink(pdf, page, url, title) {
	const link = pdf.context.obj({
		Type: 'Annot',
		Subtype: 'Link',
		Rect: [0, 0, page.getWidth(), page.getHeight()],
		Border: [0, 0, 0],
		A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
		...(title ? { Contents: PDFString.of(title) } : {})
	});
	const linkRef = pdf.context.register(link);
	const annotations = page.node.get(PDFName.of('Annots'));

	if (annotations) {
		pdf.context.lookup(annotations, PDFArray).push(linkRef);
	} else {
		page.node.set(PDFName.of('Annots'), pdf.context.obj([linkRef]));
	}
}

function isPdf(bytes) {
	return bytes.subarray(0, 5).toString() === '%PDF-';
}

function isPng(bytes) {
	return bytes.subarray(0, 8).equals(
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
	);
}

function isJpeg(bytes) {
	return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

async function createPdfFromImage(bytes) {
	const pdf = await PDFDocument.create();
	const image = isPng(bytes)
		? await pdf.embedPng(bytes)
		: isJpeg(bytes)
			? await pdf.embedJpg(bytes)
			: undefined;

	if (!image) {
		throw new Error('Input must be a PDF, PNG, or JPEG image.');
	}

	const page = pdf.addPage([image.width, image.height]);
	page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
	return pdf;
}

try {
	const { url, inputPath, outputPath, title } = parseArguments(process.argv.slice(2));
	const input = await readFile(inputPath);
	const pdf = isPdf(input)
		? await PDFDocument.load(input)
		: await createPdfFromImage(input);

	if (title) pdf.setTitle(title);

	for (const page of pdf.getPages()) {
		addFullPageUriLink(pdf, page, url, title);
	}

	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, await pdf.save());
	console.log(`Added full-page link annotations to ${outputPath}`);
} catch (error) {
	console.error(`Error: ${error.message}`);
	usage();
	process.exit(1);
}
