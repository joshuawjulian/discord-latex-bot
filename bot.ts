const DISCORD_TOKEN = Deno.env.get('DISCORD_TOKEN');
console.log('TOKEN', DISCORD_TOKEN);

import {
	AttachmentBuilder,
	Client,
	Events,
	GatewayIntentBits,
	Guild,
} from 'npm:discord.js';
import { liteAdaptor } from 'npm:mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'npm:mathjax-full/js/handlers/html.js';
import { TeX } from 'npm:mathjax-full/js/input/tex.js';
import { AllPackages } from 'npm:mathjax-full/js/input/tex/AllPackages.js';
import { mathjax } from 'npm:mathjax-full/js/mathjax.js';
import { SVG } from 'npm:mathjax-full/js/output/svg.js';
import { latexStringToPngBuffer } from './convert.ts';

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
	return adaptor.innerHTML(node);
}

// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
	],
});

const latexMap = new Map<string, string>();

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

	const _guild = readyClient.guilds.cache.get('1325157265266970709') as Guild;

	readyClient.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
		const prevReply = latexMap.get(oldMessage.id);
		if (prevReply) {
			const replyChannel = await readyClient.channels.fetch(
				oldMessage.channelId,
			);
			if (replyChannel && replyChannel.isTextBased()) {
				const reply = await replyChannel.messages.fetch(prevReply);
				if (reply) {
					await reply.delete();
					latexMap.delete(oldMessage.id);
				}
			}
		}

		if (newMessage.content.startsWith('!math ')) {
			const latexString = newMessage.content.slice(6);
			const file = new AttachmentBuilder(
				await latexStringToPngBuffer(latexString),
				{ name: 'latex.png' },
			);
			const reply = await newMessage.reply({ files: [file] });
			latexMap.set(newMessage.id, reply.id);
			console.log('LaTeX:', latexString);
		}
	});

	readyClient.on(Events.MessageCreate, async (message) => {
		if (message.content.startsWith('!math ')) {
			const latexString = message.content.slice(6);
			const file = new AttachmentBuilder(
				await latexStringToPngBuffer(latexString),
				{ name: 'latex.png' },
			);
			const reply = await message.reply({ files: [file] });
			latexMap.set(message.id, reply.id);
			console.log('LaTeX:', latexString);
		}
	});
});
// Log in to Discord with your client's token
try {
	client.login(DISCORD_TOKEN);
} catch (error) {
	console.error(`Failed to login with token: ${DISCORD_TOKEN}`);
	console.error(error);
}
