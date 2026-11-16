// QR code desenhado com Views (sem SVG nem código nativo): funciona no celular e no site.
import createQR from 'qrcode-generator';
import { useMemo } from 'react';
import { View } from 'react-native';

/** Fundo sempre branco e módulos pretos: leitores precisam de contraste, em qualquer tema. */
export function QRCodeView({ value, size = 220, label }: { value: string; size?: number; label?: string }) {
  const rows = useMemo(() => {
    const qr = createQR(0, 'M');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    // Junta módulos escuros vizinhos da mesma linha em um único retângulo (bem menos Views).
    const out: { y: number; runs: [number, number][] }[] = [];
    for (let y = 0; y < n; y++) {
      const runs: [number, number][] = [];
      let start = -1;
      for (let x = 0; x <= n; x++) {
        const dark = x < n && qr.isDark(y, x);
        if (dark && start < 0) start = x;
        if (!dark && start >= 0) { runs.push([start, x - start]); start = -1; }
      }
      out.push({ y, runs });
    }
    return { n, out };
  }, [value]);

  const quiet = 4; // margem branca obrigatória (em módulos)
  const cell = size / (rows.n + quiet * 2);
  return (
    <View accessibilityRole="image" accessibilityLabel={label ?? 'QR code'}
      style={{ width: size, height: size, backgroundColor: '#FFFFFF', borderRadius: 12 }}>
      {rows.out.map(({ y, runs }) => runs.map(([x, w]) => (
        <View key={`${y}-${x}`} style={{
          position: 'absolute', backgroundColor: '#000000',
          left: (x + quiet) * cell, top: (y + quiet) * cell, width: w * cell + 0.5, height: cell + 0.5,
        }} />
      )))}
    </View>
  );
}
