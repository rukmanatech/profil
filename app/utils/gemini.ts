import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Inisialisasi Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Fungsi untuk membersihkan dan memformat string JSON
function sanitizeJsonString(str: string) {
  try {
    // Hapus markdown jika ada
    str = str.replace(/```json\s*|\s*```/g, '');
    
    // Hapus karakter non-printable
    str = str.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Hapus whitespace di awal dan akhir
    str = str.trim();
    
    // Coba ekstrak JSON jika ada
    const jsonMatch = str.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      str = jsonMatch[0];
    }
    
    // Pastikan string dimulai dengan { dan diakhiri dengan }
    if (!str.startsWith('{') || !str.endsWith('}')) {
      throw new Error('Invalid JSON format');
    }
    
    return str;
  } catch (error) {
    console.error('Error in sanitizeJsonString:', error);
    throw error;
  }
}

export async function generateBlogContent(project: any) {
  try {
    // Dapatkan model gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Kamu adalah seorang content writer profesional yang ahli dalam menulis artikel blog teknikal.
    Tolong buatkan artikel blog dengan gaya penulisan yang menarik dan informatif berdasarkan informasi berikut:

    ${project.title ? `Judul: ${project.title}` : ''}
    ${project.description ? `Deskripsi: ${project.description}` : ''}
    ${project.content ? `Konten: ${project.content}` : ''}
    ${project.technologies?.length ? `Teknologi: ${project.technologies.join(', ')}` : ''}
    
    Artikel harus mencakup poin-poin berikut:
    1. Pengenalan yang menarik perhatian pembaca
    2. Penjelasan detail yang informatif
    3. Contoh dan ilustrasi yang relevan
    4. Kesimpulan yang mengesankan
    
    Panduan tambahan:
    - Gunakan bahasa yang profesional namun mudah dipahami
    - Sertakan contoh teknis yang relevan
    - Berikan insight menarik
    - Fokus pada value dan impact
    
    SANGAT PENTING: Berikan response dalam format JSON yang valid seperti contoh di bawah ini:

    {
      "title": "Judul artikel yang catchy dan SEO-friendly",
      "content": "Konten artikel dengan formatting HTML sederhana menggunakan tag p dan h2 saja",
      "excerpt": "Ringkasan singkat (maksimal 150 karakter)",
      "suggestedTags": ["tag1", "tag2", "tag3"]
    }

    JANGAN TAMBAHKAN APAPUN SELAIN OBJECT JSON DI ATAS. JANGAN GUNAKAN MARKDOWN ATAU CODE BLOCKS.`;

    // Generate konten
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw response:', text); // Debug log
    
    try {
      // Bersihkan dan parse JSON
      const sanitizedJson = sanitizeJsonString(text);
      console.log('Sanitized JSON:', sanitizedJson); // Debug log
      
      // Parse JSON dengan error handling yang lebih baik
      let blogData;
      try {
        blogData = JSON.parse(sanitizedJson);
      } catch (jsonError) {
        console.error('JSON Parse Error:', jsonError);
        console.error('Failed JSON string:', sanitizedJson);
        throw new Error('Format JSON tidak valid');
      }
      
      // Validasi struktur data
      if (!blogData.title || !blogData.content || !blogData.excerpt) {
        console.error('Invalid data structure:', blogData);
        throw new Error('Data tidak lengkap');
      }
      
      // Bersihkan data sebelum dikembalikan
      return {
        title: blogData.title.trim(),
        content: blogData.content
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .trim(),
        excerpt: blogData.excerpt.trim(),
        suggestedTags: blogData.suggestedTags || []
      };
    } catch (parseError) {
      console.error('Processing Error:', parseError);
      throw new Error(`Gagal memproses response: ${(parseError as Error).message}`);
    }
  } catch (error) {
    console.error('Generation Error:', error);
    throw error;
  }
} 