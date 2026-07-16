# Sizing Report Requirements

Each sizing report must provide equivalent dimensions for the target layout in CSS pixels, PDF points, and custom-paper inches. Include both rounded and precise values where applicable.

| Context | Required format |
| --- | --- |
| Web/CSS viewport | `width x height CSS px` |
| PDF page | `width x height pt` |
| Rounded PDF page | `width x height pt` using whole numbers |
| Custom paper size | `width x height in` with precise values available below |

## Required Sections

Use the following section order and formatting in every report.

````md
# [Target] Layout and Print Size

Use the following equivalent dimensions for a [target]-sized layout.

| Context | Width | Height |
| --- | ---: | ---: |
| Web/CSS viewport | [width] CSS px | [height] CSS px |
| PDF page | [width] pt | [height] pt |
| PDF page, rounded | [width] pt | [height] pt |
| Custom paper size | [width] in | [height] in |

## CSS Layout

```text
[width] x [height] px
```

## PDF Page Size

Use the rounded page size when a whole-number value is required:

```text
[width] x [height] pt
```

## Custom Paper Settings

```text
Width:  [width] in
Height: [height] in
```

More precise values:

```text
Width:  [precise width] in
Height: [precise height] in
```

Recommended print settings:

```text
Paper size: [width] x [height] in
Margins: 0
Scale: 100%
Headers and footers: Off
Orientation: Portrait
```

## Conversion Reference

```text
96 CSS px = 72 pt
1 CSS px = 0.75 pt

[width] / 96 = [width in inches] in
[height] / 96 = [height in inches] in
```
````

## Required Values

For the iPhone sizing report, use:

| Context | Width | Height |
| --- | ---: | ---: |
| Web/CSS viewport | 413 CSS px | 895 CSS px |
| PDF page | 309.75 pt | 671.25 pt |
| PDF page, rounded | 310 pt | 671 pt |
| Custom paper size | 4.302 in | 9.323 in |
