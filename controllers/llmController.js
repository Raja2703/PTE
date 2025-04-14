import { GoogleGenAI, createUserContent, createPartFromUri } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: 'AIzaSyAlz2ZeCKtEOmvHj_dJWaXpHaB53_7qVks' });

function extractJsonFromCodeBlock(aiResponseText) {
	const codeBlockRegex = /```(?:json)?\n([\s\S]*?)\n```/;
	const match = aiResponseText.match(codeBlockRegex);
	if (match && match[1]) {
		try {
			const jsonString = match[1];
			const parsed = JSON.parse(jsonString);
			return parsed;
		} catch (err) {
			console.error('Failed to parse JSON:', err);
			return null;
		}
	} else {
		console.warn('No JSON code block found');
		return null;
	}
}

export async function evaluateSummary(req, res) {
	// const qsns = [
	// 	{
	// 		paragraph:
	// 			'Climate change is an urgent global issue that requires immediate action from governments, businesses, and individuals. The rising levels of greenhouse gases are leading to more frequent natural disasters, including wildfires, hurricanes, and floods. Scientists emphasize that reducing carbon emissions and investing in renewable energy are critical steps to mitigate the damage. Delay in addressing the issue could result in irreversible damage to ecosystems and human health.',
	// 		summary: 'Climate change is serious and we must act now to save the planet and peoples from natural disasters happening often.',
	// 	},
	// 	{
	// 		paragraph:
	// 			'Artificial Intelligence (AI) is revolutionizing industries by automating processes, increasing efficiency, and enabling new services. In healthcare, AI helps in early diagnosis and personalized treatment plans. In finance, it detects fraud and provides smarter investment strategies. Despite its benefits, there are concerns about job displacement and ethical use of data. Thus, while AI presents tremendous opportunities, it must be developed responsibly.',
	// 		summary: 'AI is changing many things like health and finance, but some people fear it might take jobs and be risky.',
	// 	},
	// 	{
	// 		paragraph:
	// 			"Tourism has become one of the world's major economic sectors, contributing significantly to employment and GDP in many countries. However, mass tourism also causes environmental degradation and cultural disruption. Sustainable tourism promotes responsible travel that conserves the environment and respects local cultures. Governments and tourists alike are encouraged to adopt practices that minimize negative impacts while maximizing the benefits of tourism.",
	// 		summary: 'Sustainable tourism helps environment and local people while keeping the benefits of travel and tourism alive.',
	// 	},
	// 	{
	// 		paragraph:
	// 			'The rise of social media platforms has transformed the way people communicate and consume information. These platforms allow users to share opinions, connect with others globally, and stay updated with current events. However, they also contribute to the spread of misinformation, cyberbullying, and addiction. Educators and policymakers are working to promote digital literacy to help users navigate these platforms responsibly.',
	// 		summary: 'Social media is cool and lets people talk and learn, but also makes fake news and stress so people should be careful.',
	// 	},
	// 	{
	// 		paragraph:
	// 			'Space exploration has led to many scientific discoveries and technological advancements that benefit life on Earth. From satellite communications to weather forecasting, the technologies developed for space missions have numerous applications. Moreover, exploring outer space helps scientists understand planetary systems and the origins of the universe. Continued investment in space programs can inspire innovation and global cooperation.',
	// 		summary: 'Space programs help Earth with things like weather and tech and teaches us about the universe.',
	// 	},
	// ];

	const paragraph = req.body.paragraph;
	const userSummary = req.body.userSummary;

	try {
		const chat = ai.chats.create({
			model: 'gemini-2.0-flash',
			history: [
				{
					role: 'user',
					parts: [{ text: 'Hello' }],
				},
				{
					role: 'model',
					parts: [{ text: 'Great to meet you. What would you like to know?' }],
				},
			],
		});

		await chat.sendMessage({
			message: `You are a PTE (Pearson Test of English) examiner assistant. ${userSummary} is a user's response summary to the given para ${paragraph}:
	              Evaluate summary quality based on:
	                * How accurately it captures the key points from the paragraph.
	                * Whether it logically connects the ideas.
	                * Conciseness and coherence.
	                * Check for grammar and language quality, noting:
	                * Grammatical errors
	                * Informal language or vague phrases
	                * Sentence structure and punctuation

	              Give an overall score out of 5:
	                5 = Excellent summary with no grammar issues
	                4 = Good summary, minor language flaws
	                3 = Moderate quality, some missing points or errors
	                2 = Weak summary, many issues or vague content
	                1 = Poor summary, inaccurate or very informal

	              Provide a brief feedback comment on what could be improved.`,
		});

		const response2 = await chat.sendMessage({
			message: `${paragraph}. this is paragraph given to the user. And below is the summarized response from the user ${userSummary}.
	              give the response in json format:
	              response: {
	                rating: 1-5,
	                paragraph: paragraph,
	                userSummary:userSummary,
	              feedback: AI feedback here,
	              suggested response: suggested improvement here
	              }`,
		});

		const cleanedResponse = extractJsonFromCodeBlock(response2.text);

		res.status(200).json({
			success: true,
			data: cleanedResponse,
		});
	} catch (err) {
		res.status(400).json({
			success: false,
			error: err.message,
		});
	}
}

export async function evaluateReadingSkill(req, res) {
	try {
		const paragraph = req.body.paragraph;
		const file = req.files?.voiceInput; // Assuming you're using something like multer for file upload

		if (!file) {
			return res.status(400).json({ error: 'No file uploaded' });
		}

		// Step 1: Save the uploaded file temporarily
		const tempFilePath = path.join(__dirname, 'temp_audio.mp3');
		fs.writeFileSync(tempFilePath, file.data);

		// Step 2: Upload the temporary audio file to Gemini AI
		const uploadedFile = await ai.files.upload({
			file: tempFilePath,
			config: { mimeType: 'audio/mp3' },
		});

		const chat = ai.chats.create({
			model: 'gemini-2.0-flash',
			history: [
				{
					role: 'user',
					parts: [{ text: 'Hello' }],
				},
				{
					role: 'model',
					parts: [{ text: 'Great to meet you. What would you like to know?' }],
				},
			],
		});

		await chat.sendMessage({
			message: `You are a PTE (Pearson Test of English) speaking evaluation assistant.

	      A paragraph will be provided, and the user has read it aloud. Their response is recorded in an audio file (MP3).

	      Please evaluate the user's spoken response based on the following criteria:

	      * **Pronunciation** - Are the words pronounced clearly and accurately?
	      * **Fluency** - Is the speech smooth, natural, and consistent?
	      * **Tone** - Is the tone appropriate, with natural intonation and rhythm?
	      * **Pauses** - Are there any unnatural or excessive pauses that break the flow?

	      Give an overall **score out of 5**:
	        5 = Excellent: Clear pronunciation, natural flow, no awkward pauses
	        4 = Good: Minor mispronunciations or slightly uneven pacing
	        3 = Fair: Noticeable issues in pronunciation or fluency
	        2 = Poor: Several mistakes, hesitations, or mechanical tone
	        1 = Very Poor: Difficult to understand, frequent unnatural pauses

	      Also provide a short feedback comment on what could be improved.
	      `,
		});

		const response2 = await chat.sendMessage({
			message: createUserContent([
				createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
				`${paragraph}. this is paragraph given to the user. Evaluate this audio for pronunciation, fluency, tone, and unnatural pauses..
	      Format your response as a JSON object:
	      {
	        rating: 1-5,
	        feedback: "AI-generated feedback here",
	        suggestions: "What the user can do to improve",
	        paragraph: "Original paragraph",
	      }`,
			]),
		});

		// Step 3: Clean up: Delete the temporary file
		fs.unlinkSync(tempFilePath); // Remove the file after use

		const cleanedResponse = extractJsonFromCodeBlock(response2.text);

		res.status(200).json({
			success: true,
			data: cleanedResponse,
		});
	} catch (err) {
		res.status(400).json({
			success: false,
			error: err.message || 'An error occurred.',
		});
	}
}
