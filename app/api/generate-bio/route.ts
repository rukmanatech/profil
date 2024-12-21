import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Inisialisasi Gemini API dengan environment variable yang benar
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { currentBio } = await request.json();

    if (!currentBio) {
      return NextResponse.json(
        { error: 'Current bio is required' },
        { status: 400 }
      );
    }

    // Buat model Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Prompt untuk memperbaiki bio
    const prompt = `
      Sebagai seorang profesional AI, tolong perbaiki dan tingkatkan bio profil berikut ini:
      "${currentBio}"

      Harap perhatikan:
      1. Pertahankan informasi penting dan kata kunci utama
      2. Perbaiki tata bahasa dan struktur kalimat
      3. Buat lebih menarik dan profesional
      4. Pastikan tetap otentik dan personal
      5. Optimalkan untuk pembaca profesional
      6. Maksimal 500 karakter
      7. Gunakan bahasa yang natural dan mengalir
      8. Jika bio menggunakan bahasa Indonesia, tetap gunakan bahasa Indonesia
      9. Jika bio menggunakan bahasa Inggris, tetap gunakan bahasa Inggris

      Berikan hasil perbaikan bio dalam format yang langsung bisa digunakan (tanpa komentar atau penjelasan tambahan).
    `;

    // Generate respons
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedBio = response.text();

    return NextResponse.json({ generatedBio });
  } catch (error) {
    console.error('Error generating bio:', error);
    return NextResponse.json(
      { error: 'Failed to generate bio' },
      { status: 500 }
    );
  }
} 