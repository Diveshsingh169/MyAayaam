import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import DataTable, { type DataTableColumn } from "@/components/ui/data-table";
import type { ManagedUser, UserRole } from "../types/user";
const labels:Record<UserRole,string>={super_admin:"Super Admin",department_admin:"Department Admin",worker:"Worker"};
type Props={users:ManagedUser[];busyId:number|null;onEdit:(u:ManagedUser)=>void;onToggle:(u:ManagedUser)=>void};
export default function UserTable({users,busyId,onEdit,onToggle}:Props) {
 const columns:DataTableColumn<ManagedUser>[]=[
  {key:"user",header:"USER",render:u=><div className="user-name-cell"><span className="user-row-avatar">{u.name.trim().charAt(0).toUpperCase()}</span><div><strong>{u.name}</strong><small>{u.email}</small></div></div>},
  {key:"role",header:"ROLE",render:u=><Badge tone={u.role==="department_admin"?"accent":"neutral"}>{labels[u.role]}</Badge>},
  {key:"department",header:"DEPARTMENT",render:u=><span>{u.department_id?"Department #"+u.department_id:"—"}</span>},
  {key:"status",header:"STATUS",render:u=><Badge tone={u.is_active?"success":"neutral"} dot>{u.is_active?"Active":"Inactive"}</Badge>},
  {key:"created",header:"CREATED",render:u=><span>{new Date(u.created_at).toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"})}</span>},
  {key:"actions",header:"ACTIONS",className:"user-actions-cell",render:u=><div className="department-actions">
   <Button size="sm" variant="secondary" onClick={()=>onEdit(u)}>Edit</Button>
   <Button size="sm" variant={u.is_active?"danger":"secondary"} disabled={busyId===u.id} onClick={()=>onToggle(u)}>{busyId===u.id?"Please wait…":u.is_active?"Deactivate":"Activate"}</Button>
  </div>}
 ];
 return <DataTable rows={users} columns={columns} getRowKey={u=>u.id} className="user-table-wrap" tableClassName="user-table"/>;
}
