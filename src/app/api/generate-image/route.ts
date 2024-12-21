import { NextResponse } from "next/server";

import { put } from "@vercel/blob";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    // TODO: Call your Image Generation API here
    // For now, we'll just echo back the text

    console.log(text);
    const url = new URL("https://tawhid-mahmud42--sd-demo-model-generate-image.modal.run/")
    url.searchParams.set("prompt", text);

    console.log("Request URL:", url.toString());


    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-KEY": process.env.API_KEY || "",
        Accept: "image/jpeg"
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Response:", errorText);
      throw new Error(
        `HTTP error! Status: ${response.status}, message: ${errorText}`
      );
    }

    const imageBuffer = await response.arrayBuffer();

    const filename = `${crypto.randomUUID()}.jpeg`;
    const blob = await put(filename, imageBuffer, {
      access: "public",
      contentType: "image/jpeg",
    });


    return NextResponse.json({
      success: true,
      imageUrl: blob.url,
    });

    console.log("Image uploaded to Vercel Blob:", blob);


    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);

    return NextResponse.json({
      success: true,
      message: `Received: ${text}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
