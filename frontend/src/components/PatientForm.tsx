import { useEffect, useState } from "react";
import { getDoctors } from "../api/auth";

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  primaryCondition: string;
  careStatus: string;
  notes: string;
  diagnosis: string;
  doctorId: string;
}

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<PatientFormData>;
  doctors?: any[];
}

export const PatientForm = ({ onSubmit, isLoading = false, initialData, doctors: initialDoctors }: PatientFormProps) => {
  const [doctors, setDoctors] = useState(initialDoctors || []);
  const [loading, setLoading] = useState(!initialDoctors);
  const [formData, setFormData] = useState<PatientFormData>(
    initialData
      ? {
          firstName: initialData.firstName ?? "",
          lastName: initialData.lastName ?? "",
          dateOfBirth: initialData.dateOfBirth ?? "",
          gender: initialData.gender ?? "male",
          phone: initialData.phone ?? "",
          email: initialData.email ?? "",
          address: initialData.address ?? "",
          emergencyContact: initialData.emergencyContact ?? "",
          primaryCondition: initialData.primaryCondition ?? "",
          careStatus: initialData.careStatus ?? "stable",
          notes: initialData.notes ?? "",
          diagnosis: initialData.diagnosis ?? "",
          doctorId: initialData.doctorId ?? "",
        }
      : {
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          gender: "male",
          phone: "",
          email: "",
          address: "",
          emergencyContact: "",
          primaryCondition: "",
          careStatus: "stable",
          notes: "",
          diagnosis: "",
          doctorId: "",
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
    setFormData((prev: PatientFormData) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (loading) {
    return <div className="feedback-panel">Loading doctors...</div>;
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>First Name *</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
          placeholder="First name"
        />
      </div>

      <div className="form-group">
        <label>Last Name *</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
          placeholder="Last name"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Date of Birth *</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Gender *</label>
          <select name="gender" value={formData.gender} onChange={handleChange} required>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone number"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Street address"
        />
      </div>

      <div className="form-group">
        <label>Emergency Contact</label>
        <input
          type="text"
          name="emergencyContact"
          value={formData.emergencyContact}
          onChange={handleChange}
          placeholder="Emergency contact info"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Primary Condition *</label>
          <input
            type="text"
            name="primaryCondition"
            value={formData.primaryCondition}
            onChange={handleChange}
            required
            placeholder="Primary condition"
          />
        </div>

        <div className="form-group">
          <label>Care Status</label>
          <select name="careStatus" value={formData.careStatus} onChange={handleChange}>
            <option value="stable">Stable</option>
            <option value="improved">Improved</option>
            <option value="declined">Declined</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Diagnosis *</label>
        <input
          type="text"
          name="diagnosis"
          value={formData.diagnosis}
          onChange={handleChange}
          required
          placeholder="Diagnosis"
        />
      </div>

      <div className="form-group">
        <label>Doctor *</label>
        <select name="doctorId" value={formData.doctorId} onChange={handleChange} required>
          <option value="">Select a doctor</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.full_name} ({doctor.specialization || "General Practice"})
            </option>
          ))}
        </select>
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
          {isLoading ? "Saving..." : "Save Patient"}
        </button>
      </div>
    </form>
  );
};
