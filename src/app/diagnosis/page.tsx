import { backgroundStyleFor } from "@/lib/background";
import { getDiagnosisFormData } from "@/lib/diagnosis";
import { getContentMap } from "@/lib/site-content";
import { DiagnosisWizard } from "./DiagnosisWizard";

const CONTENT_KEYS = [
  "diagnosis.step1_label",
  "diagnosis.step1_heading",
  "diagnosis.age_label",
  "diagnosis.gender_label",
  "diagnosis.step2_label",
  "diagnosis.step2_heading",
  "diagnosis.multi_select_hint",
  "diagnosis.next_button",
  "diagnosis.symptom_heading_template",
  "diagnosis.submit_button",
  "diagnosis.loading_text",
  "diagnosis.background_image_url",
];

export default async function DiagnosisPage() {
  const [data, copy] = await Promise.all([getDiagnosisFormData(), getContentMap(CONTENT_KEYS)]);
  return (
    <main className="flex flex-1 flex-col px-6 py-10" style={backgroundStyleFor(copy["diagnosis.background_image_url"])}>
      <div className="mx-auto w-full max-w-md">
        <DiagnosisWizard data={data} copy={copy} />
      </div>
    </main>
  );
}
