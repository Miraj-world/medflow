const bearerAuthScheme = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
};

const errorSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Internal server error.",
    },
  },
};

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "MedFlow API",
    version: "1.0.0",
    description:
      "Interactive API documentation for the MedFlow healthcare dashboard backend.",
  },
  servers: [
    {
      url: "/",
      description: "Current server root",
    },
    {
      url: "http://localhost:10000",
      description: "Local development",
    },
  ],
  tags: [
    { name: "Health", description: "Service health checks" },
    { name: "Auth", description: "Authentication and user profile endpoints" },
    { name: "Patients", description: "Patient management endpoints" },
    { name: "Appointments", description: "Appointment scheduling endpoints" },
    { name: "Dashboard", description: "Dashboard overview data" },
    { name: "Analytics", description: "Analytics and reporting data" },
    { name: "Alerts", description: "Patient alert endpoints" },
    { name: "Assistant", description: "AI assistant endpoints" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: bearerAuthScheme,
    },
    schemas: {
      Error: errorSchema,
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "doctor@medflow.local" },
          password: { type: "string", format: "password", example: "Password123!" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["firstName", "lastName", "email", "password", "role"],
        properties: {
          firstName: { type: "string", example: "Avery" },
          lastName: { type: "string", example: "Morgan" },
          email: { type: "string", format: "email", example: "avery@medflow.local" },
          password: { type: "string", format: "password", example: "Password123!" },
          role: {
            type: "string",
            enum: ["doctor", "nurse", "admin"],
            example: "doctor",
          },
          specialization: { type: "string", example: "Cardiology" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "doctor@medflow.local" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: { type: "string", example: "development-reset-token" },
          password: { type: "string", format: "password", example: "NewPassword123!" },
        },
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string", example: "usr_123" },
          fullName: { type: "string", example: "Avery Morgan" },
          email: { type: "string", format: "email", example: "doctor@medflow.local" },
          role: { type: "string", example: "doctor" },
          specialization: { type: "string", example: "Cardiology", nullable: true },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          user: { $ref: "#/components/schemas/AuthUser" },
        },
      },
      Doctor: {
        type: "object",
        properties: {
          id: { type: "string", example: "doc_123" },
          fullName: { type: "string", example: "Dr. Maya Patel" },
          email: { type: "string", format: "email", example: "maya@medflow.local" },
          role: { type: "string", example: "doctor" },
          specialization: { type: "string", example: "Internal Medicine", nullable: true },
        },
      },
      PatientCreateRequest: {
        type: "object",
        required: [
          "firstName",
          "lastName",
          "dateOfBirth",
          "gender",
          "doctorId",
          "diagnosis",
        ],
        properties: {
          firstName: { type: "string", example: "Jordan" },
          lastName: { type: "string", example: "Lee" },
          dateOfBirth: { type: "string", format: "date", example: "1987-05-17" },
          gender: { type: "string", example: "female" },
          phone: { type: "string", example: "555-0100", nullable: true },
          email: { type: "string", format: "email", example: "jordan.lee@example.com", nullable: true },
          address: { type: "string", example: "101 Main St, Chicago, IL", nullable: true },
          emergencyContact: { type: "string", example: "Taylor Lee - 555-0110", nullable: true },
          primaryCondition: { type: "string", example: "Hypertension", nullable: true },
          careStatus: { type: "string", example: "stable", nullable: true },
          notes: { type: "string", example: "Needs monthly blood pressure follow-up.", nullable: true },
          conditions: {
            type: "array",
            items: { type: "string" },
            example: ["Hypertension", "Diabetes"],
          },
          diagnosis: { type: "string", example: "Stage 1 hypertension" },
          summary: { type: "string", example: "Initial intake assessment completed.", nullable: true },
          doctorId: { type: "string", example: "doc_123" },
        },
      },
      PatientUpdateRequest: {
        type: "object",
        properties: {
          firstName: { type: "string", example: "Jordan" },
          lastName: { type: "string", example: "Lee" },
          phone: { type: "string", example: "555-0100", nullable: true },
          email: { type: "string", format: "email", example: "jordan.lee@example.com", nullable: true },
          address: { type: "string", example: "101 Main St, Chicago, IL", nullable: true },
          emergencyContact: { type: "string", example: "Taylor Lee - 555-0110", nullable: true },
          primaryCondition: { type: "string", example: "Hypertension", nullable: true },
          careStatus: { type: "string", example: "stable", nullable: true },
          notes: { type: "string", example: "Patient requested morning appointments.", nullable: true },
        },
      },
      PatientSummary: {
        type: "object",
        additionalProperties: true,
        example: {
          id: "pat_123",
          fullName: "Jordan Lee",
          doctorName: "Dr. Maya Patel",
          primaryCondition: "Hypertension",
          careStatus: "stable",
        },
      },
      PatientDetails: {
        type: "object",
        additionalProperties: true,
        example: {
          id: "pat_123",
          fullName: "Jordan Lee",
          aiSummary: {
            summary: "Patient profile indicates high cardiovascular risk.",
            riskLevel: "high",
            recommendation: "Schedule cardiometabolic follow-up.",
            findings: ["high cardiovascular risk"],
          },
          noShowPrediction: {
            probability: 0.41,
            riskLevel: "medium",
          },
        },
      },
      PatientPrediction: {
        type: "object",
        properties: {
          aiSummary: {
            type: "object",
            properties: {
              summary: { type: "string" },
              riskLevel: { type: "string", example: "medium" },
              recommendation: { type: "string" },
              findings: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          prediction: {
            type: "object",
            additionalProperties: true,
            example: {
              probability: 0.41,
              riskLevel: "medium",
            },
          },
        },
      },
      AppointmentCreateRequest: {
        type: "object",
        required: ["patientId", "providerId", "appointmentDate", "reason"],
        properties: {
          patientId: { type: "string", example: "pat_123" },
          providerId: { type: "string", example: "doc_123" },
          appointmentDate: {
            type: "string",
            format: "date-time",
            example: "2026-05-01T14:30:00.000Z",
          },
          reason: { type: "string", example: "Quarterly follow-up" },
          notes: { type: "string", example: "Review blood pressure log.", nullable: true },
          consultationMinutes: { type: "integer", example: 30, nullable: true },
        },
      },
      AppointmentUpdateRequest: {
        type: "object",
        properties: {
          appointmentDate: {
            type: "string",
            format: "date-time",
            example: "2026-05-01T15:00:00.000Z",
          },
          status: {
            type: "string",
            enum: ["scheduled", "completed", "missed", "cancelled"],
            example: "scheduled",
          },
          reason: { type: "string", example: "Rescheduled follow-up" },
          notes: { type: "string", example: "Patient requested afternoon slot.", nullable: true },
          consultationMinutes: { type: "integer", example: 25, nullable: true },
        },
      },
      AppointmentStatusUpdateRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["scheduled", "completed", "missed", "cancelled"],
            example: "completed",
          },
          consultationMinutes: { type: "integer", example: 28, nullable: true },
        },
      },
      Appointment: {
        type: "object",
        additionalProperties: true,
        example: {
          id: "appt_123",
          patientId: "pat_123",
          providerId: "doc_123",
          appointmentDate: "2026-05-01T14:30:00.000Z",
          status: "scheduled",
          reason: "Quarterly follow-up",
        },
      },
      Alert: {
        type: "object",
        additionalProperties: true,
        example: {
          id: "alert_123",
          severity: "high",
          title: "High cardiovascular risk",
          patientId: "pat_123",
        },
      },
      DashboardResponse: {
        type: "object",
        additionalProperties: true,
        example: {
          overview: {
            patientCount: 60,
            appointmentCount: 112,
          },
          doctorLoad: [],
          conditionBreakdown: [],
          missedTrend: [],
          activeAlerts: [],
          highRiskPatients: [],
        },
      },
      AnalyticsResponse: {
        type: "object",
        additionalProperties: true,
        example: {
          overview: {
            patientCount: 60,
            missedAppointments: 8,
          },
          doctorLoad: [],
          conditionBreakdown: [],
          missedTrend: [],
        },
      },
      AssistantChatRequest: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            type: "string",
            example: "Summarize the key risks for this patient.",
          },
          context: {
            type: "object",
            additionalProperties: true,
            example: {
              patient: {
                fullName: "Jordan Lee",
                conditions: ["Hypertension", "Diabetes"],
                missedAppointments: 1,
                riskLevel: "medium",
              },
            },
          },
        },
      },
      AssistantChatResponse: {
        type: "object",
        properties: {
          reply: {
            type: "string",
            example: "The patient has chronic cardiometabolic risk factors and needs close follow-up.",
          },
        },
      },
      DeleteResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Deleted successfully." },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        description: "Verifies the API is running and confirms database connectivity.",
        responses: {
          200: {
            description: "API and database are healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    database: { type: "string", example: "connected" },
                  },
                },
              },
            },
          },
          500: {
            description: "Health check failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Sign in",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Authenticated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Reset request accepted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: true,
                  example: {
                    message:
                      "If an account exists for that email, a password reset link has been generated.",
                    resetToken: "development-reset-token",
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Complete password reset",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Password updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Password updated successfully. You can sign in now.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a user",
        description:
          "Creates the first account without authentication. After that, creating additional admin accounts requires an authenticated admin.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: true,
                  example: {
                    id: "usr_123",
                    full_name: "Avery Morgan",
                    email: "avery@medflow.local",
                    role: "doctor",
                  },
                },
              },
            },
          },
          403: {
            description: "Admin registration not allowed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          409: {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Current authenticated user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthUser" },
              },
            },
          },
          401: {
            description: "Missing or invalid token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/doctors": {
      get: {
        tags: ["Auth"],
        summary: "List doctors",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Available doctors",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Doctor" },
                },
              },
            },
          },
        },
      },
    },
    "/api/patients": {
      get: {
        tags: ["Patients"],
        summary: "List patients",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "search",
            schema: { type: "string" },
            description: "Optional search text for filtering patients.",
          },
        ],
        responses: {
          200: {
            description: "Patient list",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/PatientSummary" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Patients"],
        summary: "Create patient",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PatientCreateRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Patient created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PatientSummary" },
              },
            },
          },
          403: {
            description: "Insufficient permissions",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/patients/{patientId}": {
      get: {
        tags: ["Patients"],
        summary: "Get patient details",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "patientId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Detailed patient payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PatientDetails" },
              },
            },
          },
          404: {
            description: "Patient not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Patients"],
        summary: "Update patient",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "patientId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PatientUpdateRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Patient updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PatientSummary" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Patients"],
        summary: "Delete patient",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "patientId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Patient deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DeleteResponse" },
                example: { message: "Patient deleted successfully." },
              },
            },
          },
        },
      },
    },
    "/api/patients/{patientId}/prediction": {
      get: {
        tags: ["Patients"],
        summary: "Get patient no-show prediction",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "patientId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Prediction payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PatientPrediction" },
              },
            },
          },
        },
      },
    },
    "/api/appointments": {
      post: {
        tags: ["Appointments"],
        summary: "Create appointment",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AppointmentCreateRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Appointment created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Appointment" },
              },
            },
          },
        },
      },
    },
    "/api/appointments/{appointmentId}": {
      get: {
        tags: ["Appointments"],
        summary: "Get appointment details",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "appointmentId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Appointment record",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Appointment" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Appointments"],
        summary: "Update appointment",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "appointmentId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AppointmentUpdateRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Appointment updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Appointment" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Appointments"],
        summary: "Delete appointment",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "appointmentId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Appointment deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DeleteResponse" },
                example: { message: "Appointment deleted successfully." },
              },
            },
          },
        },
      },
    },
    "/api/appointments/{appointmentId}/status": {
      put: {
        tags: ["Appointments"],
        summary: "Update appointment status",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "appointmentId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AppointmentStatusUpdateRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Appointment status updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Appointment" },
              },
            },
          },
        },
      },
    },
    "/api/appointments/patient/{patientId}": {
      get: {
        tags: ["Appointments"],
        summary: "List appointments for a patient",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "patientId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Patient appointment list",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Appointment" },
                },
              },
            },
          },
        },
      },
    },
    "/api/dashboard": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard data",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Dashboard payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DashboardResponse" },
              },
            },
          },
        },
      },
    },
    "/api/analytics": {
      get: {
        tags: ["Analytics"],
        summary: "Get analytics overview",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Analytics payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AnalyticsResponse" },
              },
            },
          },
        },
      },
    },
    "/api/alerts": {
      get: {
        tags: ["Alerts"],
        summary: "List alerts",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 15 },
            description: "Maximum number of alerts to return.",
          },
        ],
        responses: {
          200: {
            description: "Alert list",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Alert" },
                },
              },
            },
          },
        },
      },
    },
    "/api/assistant/chat": {
      post: {
        tags: ["Assistant"],
        summary: "Chat with the AI assistant",
        description:
          "Requires OPENAI_API_KEY to be configured in the backend environment.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AssistantChatRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Assistant reply",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AssistantChatResponse" },
              },
            },
          },
          503: {
            description: "Assistant not configured",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
  },
};
