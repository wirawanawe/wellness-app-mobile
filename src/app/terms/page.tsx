'use client';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-white">
      <PageHeader title="Syarat & Ketentuan" />
      
      <div className="flex-1 px-6 py-8 space-y-8 overflow-y-auto">
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">1. Pendahuluan</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Selamat datang di Wellness App PHC. Dengan menggunakan aplikasi ini, Anda setuju untuk terikat oleh Syarat dan Ketentuan berikut. Aplikasi ini dirancang untuk membantu pemantauan kesehatan dan kebugaran Anda melalui pendampingan medis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">2. Data Pribadi & Medis</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Kami menghargai privasi Anda. Data medis (seperti hasil lab, berat badan, tekanan darah) dan data aktivitas harian yang Anda masukkan akan disimpan secara aman dan hanya digunakan untuk:
          </p>
          <ul className="list-disc ml-5 mt-3 space-y-2 text-slate-600 text-sm">
            <li>Analisis kesehatan oleh dokter pendamping yang Anda pilih.</li>
            <li>Penyusunan program wellness yang dipersonalisasi.</li>
            <li>Pemantauan progres kesehatan secara berkala.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">3. Kerahasiaan Data</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Wellness App PHC berkomitmen untuk tidak membagikan data medis atau data pribadi Anda kepada pihak ketiga tanpa izin eksplisit dari Anda, kecuali diwajibkan oleh hukum atau untuk kepentingan medis darurat.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">4. Disclaimer Medis</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Meskipun aplikasi ini memberikan saran kesehatan berdasarkan analisis dokter, aplikasi ini bukan pengganti layanan gawat darurat. Jika Anda mengalami kondisi medis kritis, segera hubungi layanan kesehatan terdekat.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">5. Persetujuan Penggunaan</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Dengan mencentang kotak persetujuan pada saat pendaftaran, Anda menyatakan bahwa Anda telah membaca, memahami, dan menyetujui seluruh isi dari Syarat dan Ketentuan ini, termasuk penggunaan data medis Anda untuk kepentingan program wellness.
          </p>
        </section>

        <div className="pt-8 text-center text-slate-400 text-[10px] font-medium italic">
          Terakhir diperbarui: 27 April 2026
        </div>
      </div>
    </div>
  );
}
