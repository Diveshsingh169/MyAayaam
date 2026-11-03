"use client";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import type { CreateUserValues, DepartmentOption, EditUserValues, ManagedUser } from "../types/user";
type Props = {
 open:boolean; editing:ManagedUser|null; isSuperAdmin:boolean; departments:DepartmentOption[];
 createValues:CreateUserValues; editValues:EditUserValues;
 onCreateChange:(v:CreateUserValues)=>void; onEditChange:(v:EditUserValues)=>void;
 onClose:()=>void; onSubmit:(e:React.FormEvent<HTMLFormElement>)=>void; saving:boolean; error:string;
};
export default function UserFormModal(p:Props) {
 const edit=Boolean(p.editing);
 return <Modal open={p.open} title={edit?"Edit user":"Create user"}
  description={edit?"Update this user's basic account details.":"Create an account with the appropriate department role."}
  onClose={p.onClose} size="md">
  <form onSubmit={p.onSubmit} className="department-form">
   <label className="department-form-field"><span>Full name</span><input required minLength={1} maxLength={100} autoComplete="name"
    value={edit?p.editValues.name:p.createValues.name}
    onChange={e=>edit?p.onEditChange({...p.editValues,name:e.target.value}):p.onCreateChange({...p.createValues,name:e.target.value})} placeholder="Enter full name"/></label>
   <label className="department-form-field"><span>Email address</span><input required type="email" maxLength={150} autoComplete="email"
    value={edit?p.editValues.email:p.createValues.email}
    onChange={e=>edit?p.onEditChange({...p.editValues,email:e.target.value}):p.onCreateChange({...p.createValues,email:e.target.value})} placeholder="name@company.com"/></label>
   {!edit && <>
    <label className="department-form-field"><span>Initial password</span><input required type="password" minLength={12} maxLength={128} autoComplete="new-password"
     value={p.createValues.password} onChange={e=>p.onCreateChange({...p.createValues,password:e.target.value})} placeholder="At least 12 characters"/>
     <small>Password is securely hashed by the backend and will not be displayed again.</small></label>
    <label className="department-form-field"><span>Role</span><select value={p.createValues.role}
     onChange={e=>p.onCreateChange({...p.createValues,role:e.target.value as CreateUserValues["role"]})}>
     {p.isSuperAdmin&&<option value="department_admin">Department Admin</option>}<option value="worker">Worker</option></select></label>
    {p.isSuperAdmin ? <label className="department-form-field"><span>Department</span><select required value={p.createValues.department_id}
      onChange={e=>p.onCreateChange({...p.createValues,department_id:e.target.value})}>
      <option value="">Select an active department</option>{p.departments.map(d=><option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}</select></label>
     : <p className="user-form-note">This Worker will automatically be assigned to your department.</p>}
   </>}
   {p.error&&<div className="department-alert error" role="alert">{p.error}</div>}
   <div className="department-modal-actions"><Button variant="secondary" type="button" onClick={p.onClose} disabled={p.saving}>Cancel</Button>
    <Button type="submit" disabled={p.saving}>{p.saving?"Saving…":edit?"Save changes":"Create user"}</Button></div>
  </form>
 </Modal>;
}
