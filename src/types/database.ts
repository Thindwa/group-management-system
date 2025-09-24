// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: string;
          group_id: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: string;
          group_id?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: string;
          group_id?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          currency: string;
          created_by: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          currency?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          currency?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      group_settings: {
        Row: {
          id: string;
          group_id: string;
          circle_duration_days: number;
          contribution_amount_default: number;
          contribution_strategy: string;
          contribution_interval_days: number;
          installments_per_circle: number;
          allow_member_override: boolean;
          funeral_benefit: number;
          sickness_benefit: number;
          allowed_relatives: string[];
          loan_interest_percent: number;
          loan_period_days: number;
          grace_period_days: number;
          reserve_min_balance: number;
          auto_waitlist_if_insufficient: boolean;
          auto_waitlist_processing: boolean;
          waitlist_policy: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          circle_duration_days?: number;
          contribution_amount_default?: number;
          contribution_strategy?: string;
          contribution_interval_days?: number;
          installments_per_circle?: number;
          allow_member_override?: boolean;
          funeral_benefit?: number;
          sickness_benefit?: number;
          allowed_relatives?: string[];
          loan_interest_percent?: number;
          loan_period_days?: number;
          grace_period_days?: number;
          reserve_min_balance?: number;
          auto_waitlist_if_insufficient?: boolean;
          auto_waitlist_processing?: boolean;
          waitlist_policy?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          circle_duration_days?: number;
          contribution_amount_default?: number;
          contribution_strategy?: string;
          contribution_interval_days?: number;
          installments_per_circle?: number;
          allow_member_override?: boolean;
          funeral_benefit?: number;
          sickness_benefit?: number;
          allowed_relatives?: string[];
          loan_interest_percent?: number;
          loan_period_days?: number;
          grace_period_days?: number;
          reserve_min_balance?: number;
          auto_waitlist_if_insufficient?: boolean;
          auto_waitlist_processing?: boolean;
          waitlist_policy?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      circles: {
        Row: {
          id: string;
          group_id: string;
          year: number;
          start_date: string;
          end_date: string;
          status: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          year: number;
          start_date: string;
          end_date: string;
          status?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          year?: number;
          start_date?: string;
          end_date?: string;
          status?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      contributions: {
        Row: {
          id: string;
          group_id: string;
          circle_id: string;
          member_id: string;
          period_index: number;
          planned_installments: number;
          amount: number;
          method: string;
          note: string | null;
          attachment_url: string | null;
          contribution_amount_snapshot: number;
          created_by: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          circle_id: string;
          member_id: string;
          period_index: number;
          planned_installments: number;
          amount: number;
          method: string;
          note?: string | null;
          attachment_url?: string | null;
          contribution_amount_snapshot: number;
          created_by: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          circle_id?: string;
          member_id?: string;
          period_index?: number;
          planned_installments?: number;
          amount?: number;
          method?: string;
          note?: string | null;
          attachment_url?: string | null;
          contribution_amount_snapshot?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      benefits: {
        Row: {
          id: string;
          group_id: string;
          circle_id: string;
          member_id: string;
          type: string;
          relative_type: string;
          relative_name: string;
          requested_amount: number;
          status: string;
          attachments: string[] | null;
          requested_at: string;
          approved_by: string | null;
          approved_at: string | null;
          paid_by: string | null;
          paid_at: string | null;
          waitlist_position: number | null;
          waitlisted_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          circle_id: string;
          member_id: string;
          type: string;
          relative_type: string;
          relative_name: string;
          requested_amount: number;
          status?: string;
          attachments?: string[] | null;
          requested_at?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          paid_by?: string | null;
          paid_at?: string | null;
          waitlist_position?: number | null;
          waitlisted_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          circle_id?: string;
          member_id?: string;
          type?: string;
          relative_type?: string;
          relative_name?: string;
          requested_amount?: number;
          status?: string;
          attachments?: string[] | null;
          requested_at?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          paid_by?: string | null;
          paid_at?: string | null;
          waitlist_position?: number | null;
          waitlisted_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      loans: {
        Row: {
          id: string;
          group_id: string;
          circle_id: string;
          borrower_id: string;
          principal: number;
          purpose: string;
          description: string | null;
          disbursed_by: string | null;
          disbursed_at: string | null;
          due_at: string | null;
          status: string;
          grace_period_days: number | null;
          grace_source: string;
          grace_adjusted_by: string | null;
          grace_adjusted_at: string | null;
          notes: string | null;
          waitlist_position: number | null;
          waitlisted_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          circle_id: string;
          borrower_id: string;
          principal: number;
          purpose: string;
          description?: string | null;
          disbursed_by?: string | null;
          disbursed_at?: string | null;
          due_at?: string | null;
          status?: string;
          grace_period_days?: number | null;
          grace_source?: string;
          grace_adjusted_by?: string | null;
          grace_adjusted_at?: string | null;
          notes?: string | null;
          waitlist_position?: number | null;
          waitlisted_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          circle_id?: string;
          borrower_id?: string;
          principal?: number;
          purpose?: string;
          description?: string | null;
          disbursed_by?: string | null;
          disbursed_at?: string | null;
          due_at?: string | null;
          status?: string;
          grace_period_days?: number | null;
          grace_source?: string;
          grace_adjusted_by?: string | null;
          grace_adjusted_at?: string | null;
          notes?: string | null;
          waitlist_position?: number | null;
          waitlisted_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      loan_payments: {
        Row: {
          id: string;
          loan_id: string;
          amount: number;
          paid_at: string;
          method: string;
          note: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          amount: number;
          paid_at: string;
          method: string;
          note?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          loan_id?: string;
          amount?: number;
          paid_at?: string;
          method?: string;
          note?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
      loan_events: {
        Row: {
          id: string;
          loan_id: string;
          type: string;
          data: Record<string, any>;
          actor_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          type: string;
          data?: Record<string, any>;
          actor_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          loan_id?: string;
          type?: string;
          data?: Record<string, any>;
          actor_id?: string;
          created_at?: string;
        };
      };
      ledger: {
        Row: {
          id: string;
          group_id: string;
          circle_id: string;
          member_id: string | null;
          type: string;
          ref_id: string;
          amount: number;
          direction: string;
          created_at: string;
          created_by: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          circle_id: string;
          member_id?: string | null;
          type: string;
          ref_id: string;
          amount: number;
          direction: string;
          created_at?: string;
          created_by: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          circle_id?: string;
          member_id?: string | null;
          type?: string;
          ref_id?: string;
          amount?: number;
          direction?: string;
          created_at?: string;
          created_by?: string;
          description?: string | null;
        };
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string;
          action: string;
          entity: string;
          entity_id: string;
          payload: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          action: string;
          entity: string;
          entity_id: string;
          payload?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string;
          action?: string;
          entity?: string;
          entity_id?: string;
          payload?: Record<string, any>;
          created_at?: string;
        };
      };
    };
    Functions: {
      rpc_review_benefit: {
        Args: {
          p_benefit_id: string;
          p_action: string;
        };
        Returns: void;
      };
      rpc_review_loan: {
        Args: {
          p_loan_id: string;
          p_action: string;
        };
        Returns: void;
      };
      rpc_make_contribution: {
        Args: {
          p_member_id: string;
          p_circle_id: string;
          p_period_index: number;
          p_amount: number;
          p_method: string;
          p_note?: string;
          p_attachment_url?: string;
        };
        Returns: string;
      };
      rpc_pay_benefit: {
        Args: {
          p_benefit_id: string;
          p_paid_amount: number;
          p_method?: string;
          p_note?: string;
        };
        Returns: void;
      };
      rpc_disburse_loan: {
        Args: {
          p_loan_id: string;
          p_disbursed_at?: string;
        };
        Returns: void;
      };
      rpc_repay_loan: {
        Args: {
          p_loan_id: string;
          p_amount: number;
          p_paid_at?: string;
          p_method?: string;
          p_note?: string;
        };
        Returns: string;
      };
      rpc_extend_grace: {
        Args: {
          p_loan_id: string;
          p_new_grace_days: number;
          p_reason: string;
        };
        Returns: void;
      };
      rpc_try_settle_waitlist: {
        Args: {
          p_group_id: string;
          p_circle_id: string;
        };
        Returns: void;
      };
      available_balance: {
        Args: {
          p_group_id: string;
          p_circle_id: string;
        };
        Returns: number;
      };
      current_user_group_id: {
        Args: {};
        Returns: string;
      };
      has_role: {
        Args: {
          roles: string[];
        };
        Returns: boolean;
      };
    };
  };
}
