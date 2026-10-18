import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const WHATSAPP_NUMBER = "919552514812";

const quoteSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  company: z.string().min(2, "Enter company name"),
  phone: z.string().min(8, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email"),
  requirement: z.string().min(10, "Tell us a little about your requirement"),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function QuoteForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
  });

  return (
    <form
      className="rounded-xl2 border border-line bg-paper p-5 shadow-card"
      onSubmit={handleSubmit((values) => {
        const message = [
          "New enquiry from the Ensure Solutions website",
          `Name: ${values.name}`,
          `Company: ${values.company}`,
          `Phone: ${values.phone}`,
          `Email: ${values.email}`,
          "Requirement:",
          values.requirement,
        ].join("\n");

        setSubmitted(true);
        reset();
        window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          <input {...register("name")} className="field" />
        </Field>
        <Field label="Company" error={errors.company?.message}>
          <input {...register("company")} className="field" />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input {...register("phone")} className="field" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...register("email")} className="field" />
        </Field>
      </div>
      <Field label="Requirement" error={errors.requirement?.message}>
        <textarea {...register("requirement")} className="field min-h-32 resize-y" />
      </Field>
      {submitted ? (
        <p className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-success">
          Your enquiry is ready to send on WhatsApp to +91 95525 14812.
        </p>
      ) : null}
      <button className="premium-button" type="submit">
        Send Enquiry <Send size={16} />
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em]">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-xs font-bold text-error">{error}</span> : null}
    </label>
  );
}
