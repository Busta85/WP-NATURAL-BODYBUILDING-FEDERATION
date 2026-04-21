import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();

// Use JSON parsing middleware
app.use(express.json());

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          { text: prompt },
          { text: "Western Province natural bodybuilding aesthetic, natural muscle, professional stage lighting, high quality" },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      },
    });

    let base64Image = null;
    if (response.candidates && response.candidates[0] && response.candidates[0].content) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = part.inlineData.data;
            break;
          }
        }
    }

    if (base64Image) {
        const imageUrl = `data:image/png;base64,${base64Image}`;
        res.json({ imageUrl });
    } else {
        res.status(500).json({ error: "No image found in response" });
    }
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// Lazy loaded Twilio client
let twilioClient: any = null;

app.post("/api/send-sms", async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: "Missing 'to' or 'message' in request body" });
    }

    if (!twilioClient) {
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      
      if (!twilioSid || !twilioToken) {
        console.warn("Twilio credentials not configured. Skipping SMS.");
        return res.status(200).json({ success: true, fake: true, message: "Twilio credentials missing; SMS logging only." });
      }
      
      const twilio = require('twilio');
      twilioClient = twilio(twilioSid, twilioToken);
    }

    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    if (!fromPhone) {
       console.warn("Twilio sender phone number not configured.");
       return res.status(200).json({ success: true, fake: true, message: "Sender number missing; SMS logging only." });
    }

    await twilioClient.messages.create({
      body: message,
      from: fromPhone,
      to: to
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error sending SMS:", error);
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

export default app;
