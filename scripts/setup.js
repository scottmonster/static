#!/usr/bin/env -S bun run --install=fallback

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { PDFArray, PDFDocument, PDFName, PDFString } from 'pdf-lib';

const projectDirectory = resolve(import.meta.dir, '..');
const baseHtmlPath = resolve(projectDirectory, 'pages', 'base.html');
const basePdfPath = resolve(projectDirectory, 'base.pdf');
const pagesDirectory = resolve(projectDirectory, 'pages');
const pdfsDirectory = resolve(projectDirectory, 'pdfs');
const repoIo = 'https://scottmonster.github.io/static/pages/';

function usage() {
	console.error(`Usage: scripts/setup.js <name> [--img <image_file>] [--pdf <pdf_file>]

Creates pages/<name>.html from pages/base.html and pdfs/<name>.pdf.
Without an image or PDF source, base.pdf is used. The output PDF links to the
generated page on GitHub.

Options:
  -i, --img <image_file>  Create the PDF from a PNG or JPEG image.
  -p, --pdf <pdf_file>    Use this PDF instead of base.pdf.`);
}

function parseArguments(args) {
	let imagePath;
	let pdfPath;
	const positional = [];

	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];

		if (argument === '-i' || argument === '--img') {
			imagePath = args[++index];
			if (!imagePath) throw new Error(`${argument} requires an image file.`);
		} else if (argument === '-p' || argument === '--pdf') {
			pdfPath = args[++index];
			if (!pdfPath) throw new Error(`${argument} requires a PDF file.`);
		} else if (argument === '--help' || argument === '-h') {
			usage();
			process.exit(0);
		} else {
			positional.push(argument);
		}
	}

	if (positional.length !== 1) throw new Error('Expected exactly one name.');

	const [name] = positional;
	if (!name || basename(name) !== name || name === '.' || name === '..') {
		throw new Error('Name must be a single filename, without a path.');
	}

	return { name, imagePath, pdfPath };
}

function isPng(bytes) {
	return bytes.subarray(0, 8).equals(
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
	);
}

function isJpeg(bytes) {
	return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

async function createPdfFromImage(imagePath) {
	const bytes = await readFile(imagePath);
	const pdf = await PDFDocument.create();
	const image = isPng(bytes)
		? await pdf.embedPng(bytes)
		: isJpeg(bytes)
			? await pdf.embedJpg(bytes)
			: undefined;

	if (!image) throw new Error('Image must be a PNG or JPEG file.');

	const page = pdf.addPage([image.width, image.height]);
	page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
	return pdf;
}

function addFullPageUriLink(pdf, page, url) {
	const link = pdf.context.obj({
		Type: 'Annot',
		Subtype: 'Link',
		Rect: [0, 0, page.getWidth(), page.getHeight()],
		Border: [0, 0, 0],
		A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) }
	});
	const linkRef = pdf.context.register(link);
	const annotations = page.node.get(PDFName.of('Annots'));

	if (annotations) {
		pdf.context.lookup(annotations, PDFArray).push(linkRef);
	} else {
		page.node.set(PDFName.of('Annots'), pdf.context.obj([linkRef]));
	}
}

try {
	const { name, imagePath, pdfPath } = parseArguments(process.argv.slice(2));
	const htmlOutputPath = resolve(pagesDirectory, `${name}.html`);
	const pdfOutputPath = resolve(pdfsDirectory, `${name}.pdf`);

	await Promise.all([
		mkdir(pagesDirectory, { recursive: true }),
		mkdir(pdfsDirectory, { recursive: true })
	]);
	await copyFile(baseHtmlPath, htmlOutputPath);

	const pdf = imagePath
		? await createPdfFromImage(imagePath)
		: await PDFDocument.load(await readFile(pdfPath ?? basePdfPath));
	const pageUrl = new URL(`${encodeURIComponent(name)}.html`, repoIo).href;

	for (const page of pdf.getPages()) {
		addFullPageUriLink(pdf, page, pageUrl);
	}

	await writeFile(pdfOutputPath, await pdf.save());

	console.log(`Created ${htmlOutputPath} and ${pdfOutputPath}`);
} catch (error) {
	console.error(`Error: ${error.message}`);
	usage();
	process.exit(1);
}
