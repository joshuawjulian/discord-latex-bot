import 'jsr:@std/dotenv/load';
import {
	AttachmentBuilder,
	Client,
	Events,
	GatewayIntentBits,
	Message,
} from 'npm:discord.js';
import { extractLatex, latexStringToPngBuffer } from './convert.ts';

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
client.on(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

	const _guild = readyClient.guilds.cache.get('1325157265266970709');
	if (!_guild) {
		console.error('Guild not found!');
		return;
	}

	readyClient.on(Events.MessageCreate, async (message) => {
		if (message.author.bot) return;
		const latexStr = extractLatex(message.content);
		if (latexStr == null) return;

		const file = new AttachmentBuilder(await latexStringToPngBuffer(latexStr), {
			name: 'latex.png',
		});

		const reply = await message.reply({ files: [file] });
		latexMap.set(message.id, reply.id);
		console.log('LaTeX:', latexStr);
	});

	readyClient.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
		if (oldMessage === null) return;
		if (newMessage === null) return;
		if (oldMessage.author && oldMessage.author.bot) return;
		if (oldMessage.content === newMessage.content) return;

		const oldLatex = extractLatex(oldMessage.content);
		const newLatex = extractLatex(newMessage.content);

		if (oldLatex == null && newLatex == null) return;
		if (oldLatex === newLatex) return;

		let reply: Message | null = null;

		if (oldLatex) {
			const prevReply = latexMap.get(oldMessage.id);
			if (prevReply) {
				const replyChannel = await readyClient.channels.fetch(
					oldMessage.channelId,
				);
				if (replyChannel && replyChannel.isTextBased()) {
					reply = await replyChannel.messages.fetch(prevReply);
				}
			}
		}

		if (newLatex) {
			const file = new AttachmentBuilder(
				await latexStringToPngBuffer(newLatex),
				{
					name: 'latex.png',
				},
			);

			if (reply) {
				reply.edit({ files: [file] });
			} else {
				const newReply = await newMessage.reply({ files: [file] });
				latexMap.set(newMessage.id, newReply.id);
			}
			console.log('LaTeX:', newLatex);
		} else {
			if (reply) {
				await reply.delete();
				latexMap.delete(oldMessage.id);
			}
		}
	});
});

let DISCORD_TOKEN = Deno.env.get('DISCORD_TOKEN');
console.log('TOKEN', DISCORD_TOKEN);
if (DISCORD_TOKEN?.at(0) === '"') DISCORD_TOKEN = DISCORD_TOKEN.slice(1);
if (DISCORD_TOKEN?.at(-1) === '"') DISCORD_TOKEN = DISCORD_TOKEN.slice(0, -1);
if (DISCORD_TOKEN === undefined) {
	console.error('DISCORD_TOKEN is not set');
	Deno.exit(1);
}
try {
	await client.login(DISCORD_TOKEN);
} catch (error) {
	console.error(`Failed to login with token: ${DISCORD_TOKEN}`);
	console.error(error);
}
