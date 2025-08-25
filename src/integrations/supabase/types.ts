export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      absences: {
        Row: {
          absence_type: Database["public"]["Enums"]["absence_type"]
          approved_at: string | null
          approved_by: string | null
          created_at: string
          days_count: number
          employee_id: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          absence_type: Database["public"]["Enums"]["absence_type"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_count: number
          employee_id: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          absence_type?: Database["public"]["Enums"]["absence_type"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_count?: number
          employee_id?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_recipients: {
        Row: {
          announcement_id: string
          created_at: string
          id: string
          list_id: string | null
          recipient_email: string | null
          recipient_type: string
          sent_at: string | null
        }
        Insert: {
          announcement_id: string
          created_at?: string
          id?: string
          list_id?: string | null
          recipient_email?: string | null
          recipient_type: string
          sent_at?: string | null
        }
        Update: {
          announcement_id?: string
          created_at?: string
          id?: string
          list_id?: string | null
          recipient_email?: string | null
          recipient_type?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_recipients_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_recipients_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "email_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          published: boolean
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_list_members: {
        Row: {
          created_at: string
          email: string
          id: string
          list_id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          list_id: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          list_id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "email_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      email_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          recipient_email: string
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string
          template_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject: string
          template_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_signatures: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          signature_image_url: string | null
          signature_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          signature_image_url?: string | null
          signature_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          signature_image_url?: string | null
          signature_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          name: string
          subject: string
          template_type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          subject: string
          template_type: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          subject?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          employee_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          employee_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          employee_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_municipality: string | null
          address_postal_code: string | null
          address_street: string | null
          alt_contact_name: string | null
          alt_contact_phone: string | null
          birthplace: string | null
          cc_number: string | null
          contract_active: boolean | null
          contract_renewal_date: string | null
          contract_type: Database["public"]["Enums"]["contract_type"] | null
          created_at: string
          date_of_birth: string | null
          department_id: string | null
          dependents_count: number | null
          education_level: Database["public"]["Enums"]["education_level"] | null
          employee_number: string
          employment_status: Database["public"]["Enums"]["employment_status"]
          forklift_license: boolean | null
          full_name: string
          health_number: string | null
          hire_date: string | null
          id: string
          insurance_policy_number: string | null
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          nationality: string | null
          nib_iban: string | null
          nif: string | null
          phone: string | null
          position_id: string | null
          salary: number | null
          shoe_size: number | null
          sigo_number: string | null
          social_security_number: string | null
          sweat_size: Database["public"]["Enums"]["clothing_size"] | null
          termination_date: string | null
          tshirt_size: Database["public"]["Enums"]["clothing_size"] | null
          updated_at: string
          user_id: string | null
          work_email: string | null
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_municipality?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          alt_contact_name?: string | null
          alt_contact_phone?: string | null
          birthplace?: string | null
          cc_number?: string | null
          contract_active?: boolean | null
          contract_renewal_date?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          dependents_count?: number | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          employee_number: string
          employment_status?: Database["public"]["Enums"]["employment_status"]
          forklift_license?: boolean | null
          full_name: string
          health_number?: string | null
          hire_date?: string | null
          id?: string
          insurance_policy_number?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          nationality?: string | null
          nib_iban?: string | null
          nif?: string | null
          phone?: string | null
          position_id?: string | null
          salary?: number | null
          shoe_size?: number | null
          sigo_number?: string | null
          social_security_number?: string | null
          sweat_size?: Database["public"]["Enums"]["clothing_size"] | null
          termination_date?: string | null
          tshirt_size?: Database["public"]["Enums"]["clothing_size"] | null
          updated_at?: string
          user_id?: string | null
          work_email?: string | null
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_municipality?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          alt_contact_name?: string | null
          alt_contact_phone?: string | null
          birthplace?: string | null
          cc_number?: string | null
          contract_active?: boolean | null
          contract_renewal_date?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          dependents_count?: number | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          employee_number?: string
          employment_status?: Database["public"]["Enums"]["employment_status"]
          forklift_license?: boolean | null
          full_name?: string
          health_number?: string | null
          hire_date?: string | null
          id?: string
          insurance_policy_number?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          nationality?: string | null
          nib_iban?: string | null
          nif?: string | null
          phone?: string | null
          position_id?: string | null
          salary?: number | null
          shoe_size?: number | null
          sigo_number?: string | null
          social_security_number?: string | null
          sweat_size?: Database["public"]["Enums"]["clothing_size"] | null
          termination_date?: string | null
          tshirt_size?: Database["public"]["Enums"]["clothing_size"] | null
          updated_at?: string
          user_id?: string | null
          work_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_receipts: {
        Row: {
          created_at: string
          employee_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          month: number
          sent_at: string | null
          uploaded_by: string
          year: number
        }
        Insert: {
          created_at?: string
          employee_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          month: number
          sent_at?: string | null
          uploaded_by: string
          year: number
        }
        Update: {
          created_at?: string
          employee_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          month?: number
          sent_at?: string | null
          uploaded_by?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_receipts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          department_id: string
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_hr: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      absence_type:
        | "vacation"
        | "sick_leave"
        | "medical_leave"
        | "personal_leave"
        | "maternity_leave"
        | "paternity_leave"
      clothing_size: "XS" | "S" | "M" | "L" | "XL" | "XXL"
      contract_type: "termo_certo" | "termo_incerto" | "sem_termo" | "estagio"
      document_type:
        | "nif"
        | "social_security"
        | "nib_iban"
        | "contract"
        | "id_card"
        | "cv"
        | "medical_certificate"
        | "other"
      education_level:
        | "basico"
        | "secundario"
        | "tecnico"
        | "licenciatura"
        | "pos_graduacao"
        | "mestrado"
        | "doutoramento"
        | "outro"
      employment_status: "active" | "inactive" | "terminated"
      marital_status:
        | "solteiro"
        | "casado"
        | "uniao_de_facto"
        | "divorciado"
        | "viuvo"
      user_role: "admin" | "hr" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      absence_type: [
        "vacation",
        "sick_leave",
        "medical_leave",
        "personal_leave",
        "maternity_leave",
        "paternity_leave",
      ],
      clothing_size: ["XS", "S", "M", "L", "XL", "XXL"],
      contract_type: ["termo_certo", "termo_incerto", "sem_termo", "estagio"],
      document_type: [
        "nif",
        "social_security",
        "nib_iban",
        "contract",
        "id_card",
        "cv",
        "medical_certificate",
        "other",
      ],
      education_level: [
        "basico",
        "secundario",
        "tecnico",
        "licenciatura",
        "pos_graduacao",
        "mestrado",
        "doutoramento",
        "outro",
      ],
      employment_status: ["active", "inactive", "terminated"],
      marital_status: [
        "solteiro",
        "casado",
        "uniao_de_facto",
        "divorciado",
        "viuvo",
      ],
      user_role: ["admin", "hr", "employee"],
    },
  },
} as const
