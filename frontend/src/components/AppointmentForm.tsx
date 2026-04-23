import { useEffect, useState } from "react";
import { getDoctors } from "../api/auth";

interface AppointmentFormData {
  patientId: string;
  providerId: string;
  appointmentDate: string;
  reason: string;
  notes: string;
  consultationMinutes: string;
}

interface AppointmentFormProps {
  patientId: string;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  initialData?: Partial<AppointmentFormData>;
  doctors?: any[];
}

export const AppointmentForm = ({ patientId, onSubmit, isLoading = false, initialData, doctors: initialDoctors }: AppointmentFormProps) => {
  const [doctors, setDoctors] = useState(initialDoctors || []);
  const [loading, setLoading] = useState(!initialDoctors);
  const [formData, setFormData] = useState<AppointmentFormData>(
    initialData
      ? {
          patientId,
          providerId: initialData.providerId ?? "",
          appointmentDate: initialData.appointmentDate ?? "",
          reason: initialData.reason ?? "",
          notes: initialData.notes ?? "",
          consultationMinutes: initialData.consultationMinutes ?? "",
        }
      : {
          patientId,
          providerId: "",
          appointmentDate: "",
          reason: "",
          notes: "",
          consultationMinutes: "",
        }
  );

  useEffect(() => {
    if (!initialDoctors) {
      getDoctors()
        .then(setDoctors)
        .catch(() => setDoctors([]))
        .finally(() => setLoading(false));
    }
  }, [initialDoctors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: AppointmentFormData) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      consultationMinutes: formData.consultationMinutes ? parseInt(formData.consultationMinutes) : undefined,
    };
    onSubmit(submitData);
  };

  if (loading) {
    return <div className="feedback-panel">Loading doctors...</div>;
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Provider (Doctor) *</label>
        <select name="providerId" value={formData.providerId} onChange={handleChange} required>
          <option value="">Select a doctor</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.full_name} ({doctor.specialization || "General Practice"})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Appointment Date & Time *</label>
        <input
          type="datetime-local"
          name="appointmentDate"
          value={formData.appointmentDate}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Reason for Appointment *</label>
        <input
          type="text"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          required
          placeholder="Reason for visit"
        />
      </div>

      <div className="form-group">
        <label>Consultation Duration (minutes)</label>
        <input
          type="number"
          name="consultationMinutes"
          value={formData.consultationMinutes}
          onChange={handleChange}
          placeholder="Duration in minutes"
          min="0"
        />
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional notes"
          rows={4}
        />
      </div>

      <div className="button-row">
        <button type="submit" className="primary-button" disabled={isLoading}>
          {isLoading ? "Saving..." : "Schedule Appointment"}
        </button>
      </div>
    </form>
  );
};
