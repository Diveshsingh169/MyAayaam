export type Department = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
};

export type DepartmentFormValues = {
  name: string;
  code: string;
  description: string;
};

export const emptyDepartmentForm: DepartmentFormValues = {
  name: "",
  code: "",
  description: "",
};
