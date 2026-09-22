import { db } from '@/db';
import { assets } from '@/db/schema';
import { PhotoBookTemplateEditor } from '@/components/PhotoBookTemplateEditor';
import { saveTemplateAction } from '../actions';
import { eq } from 'drizzle-orm';

export default function NewTemplatePage() {
  const sample = db.select({ id: assets.id }).from(assets).where(eq(assets.type, 'thumbnail')).limit(1).get();
  return <PhotoBookTemplateEditor id={null} sampleImage={sample ? `/api/assets/${sample.id}` : null} action={saveTemplateAction.bind(null, null)}/>;
}
