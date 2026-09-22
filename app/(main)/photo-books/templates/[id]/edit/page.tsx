import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { assets, layoutTemplates } from '@/db/schema';
import { PhotoBookTemplateEditor } from '@/components/PhotoBookTemplateEditor';
import { defaultTemplateElements, defaultTemplateSettings, validateTemplatePayload } from '@/lib/photo-book-template';
import { saveTemplateAction } from '../../actions';

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = db.select().from(layoutTemplates).where(eq(layoutTemplates.id, id)).get();
  if (!template) notFound();
  const sample = db.select({ id: assets.id }).from(assets).where(eq(assets.type, 'thumbnail')).limit(1).get();
  let payload = { settings: defaultTemplateSettings, elements: defaultTemplateElements };
  try { payload = validateTemplatePayload(JSON.parse(template.settingsJson), JSON.parse(template.elementsJson)); } catch {}
  return <PhotoBookTemplateEditor id={id} initial={{ name: template.name, description: template.description || '', ...payload }} sampleImage={sample ? `/api/assets/${sample.id}` : null} saved action={saveTemplateAction.bind(null, id)}/>;
}
