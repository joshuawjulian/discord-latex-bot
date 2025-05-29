import { Buffer } from 'node:buffer';
import { liteAdaptor } from 'npm:mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'npm:mathjax-full/js/handlers/html.js';
import { TeX } from 'npm:mathjax-full/js/input/tex.js';
import { AllPackages } from 'npm:mathjax-full/js/input/tex/AllPackages.js';
import { mathjax } from 'npm:mathjax-full/js/mathjax.js';
import { SVG } from 'npm:mathjax-full/js/output/svg.js';
import sharp from 'sharp';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const mathjax_document = mathjax.document('', {
	InputJax: new TeX({ packages: AllPackages }),
	OutputJax: new SVG({ fontCache: 'local', scale: 2 }),
});

const mathjax_options = {
	containerWidth: 1280,
};

export function get_mathjax_svg(math: string): string {
	const node = mathjax_document.convert(math, mathjax_options);
	console.log(node);
	return adaptor.innerHTML(node);
}

export function latexStringToPngBuffer(latexString: string): Promise<Buffer> {
	const svg = get_mathjax_svg(latexString);
	return sharp(new TextEncoder().encode(svg), { density: 250 })
		.png()
		.toBuffer();
}

export function extractLatex(content: string | null): string | null {
	if (content === null) return null;
	// Match $$...$$ or $...$
	const latexRegex = /\$\$(.*?)\$\$|\$(.*?)\$/gs;
	const matches = [...content.matchAll(latexRegex)];

	if (matches.length === 0) return null;

	// !TODO: Match multiple
	return matches[0][1] || matches[0][2];
}
