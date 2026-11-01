# VoxArabic AI Studio 🎙️

استوديو احترافي متطور لتحويل النصوص إلى صوت طبيعي ومبهر (24kHz WAV) باللغتين العربية والإنجليزية بشتى اللهجات والأنماط الصوتية، مدعوم بنماذج Gemini 3.8 Neural Speech.

---

## 🚀 النشر على Vercel (خطوات التشغيل السريع)

التطبيق مهيأ بالكامل للعمل على **Vercel** كـ Full-Stack App مع Serverless Functions عبر ملف `vercel.json` ومسار `/api/index.ts`.

### خطوات التشغيل بنجاح:

1. **ارفع المشروع إلى مستودعك على GitHub**:
   ```bash
   git add .
   git commit -m "Deploy VoxArabic Studio"
   git push origin main
   ```

2. **اربط المستودع مع Vercel**:
   - توجه إلى [Vercel Dashboard](https://vercel.com/dashboard) واضغط **Add New... > Project**.
   - اختر مستودع الـ GitHub الخاص بالمشروع واضغط **Import**.

3. **إضافة مفتاح الـ API (خطوة مهمة جداً)**:
   - قبل الضغط على Deploy، افتح قسم **Environment Variables** في Vercel.
   - أضف المتغير التالي:
     - **Key**: `GEMINI_API_KEY`
     - **Value**: مفتاح الـ API الخاص بك من [Google AI Studio](https://aistudio.google.com/app/apikey).
   - اضغط **Add**.

4. **اضغط Deploy**:
   - سيقوم Vercel ببناء الواجهة (`dist`) وتشغيل مسارات الـ API عبر دوال Serverless تلقائياً عبر `vercel.json`.

---

## 💻 التشغيل المحلي (Local Development)

```bash
# تثبيت الاعتماديات
npm install

# تشغيل خادم التطوير
npm run dev
```

التطبيق سيعمل على المنفذ: `http://localhost:3000`.

---

## 🌟 الميزات المضمنة:
- 5 أصوات عصبية استوديو (Kore, Puck, Charon, Fenrir, Zephyr) بتردد 24kHz.
- تغطية اللهجات: الفصحى، المصرية، الخليجية، الشامية، المغاربية، العراقية، والإنجليزية (US, UK, AU).
- استوديو حوار وسيناريو لشخصين (Dual Dialogue Studio).
- مشغل صوت بموجات حقيقية تفاعلية مع إمكانية تصدير ملفات WAV.
- زر معاينة فورية بالمتصفح (Web Speech API) للاستماع المباشر دون استهلاك الحصص.
