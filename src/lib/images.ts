import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export interface PreparedImage {
  uri: string;
  mimeType: string;
  /** Mesma imagem como data URI: exibição imediata e persistência no modo demo. */
  dataUri: string;
}

const AVATAR_SIZE = 256;

/** Abre a galeria, recorta em quadrado (centro) e reduz para 256×256 JPEG. Retorna null se cancelar. */
export async function pickAvatar(): Promise<PreparedImage | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
  const asset = res.canceled ? undefined : res.assets[0];
  if (!asset) return null;

  const ctx = ImageManipulator.manipulate(asset.uri);
  const side = Math.min(asset.width, asset.height);
  if (side > 0 && asset.width !== asset.height) {
    ctx.crop({ originX: (asset.width - side) / 2, originY: (asset.height - side) / 2, width: side, height: side });
  }
  ctx.resize({ width: AVATAR_SIZE, height: AVATAR_SIZE });
  const rendered = await ctx.renderAsync();
  const out = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
  return { uri: out.uri, mimeType: 'image/jpeg', dataUri: `data:image/jpeg;base64,${out.base64}` };
}
