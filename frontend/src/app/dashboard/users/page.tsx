"use client";
import { useCallback,useEffect,useMemo,useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import SearchField from "@/components/ui/search-field";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { EmptyState,ErrorState,LoadingState } from "@/components/ui/feedback-state";
import UserFormModal from "@/features/users/components/user-form-modal";
import UserTable from "@/features/users/components/user-table";
import { createUser,listActiveDepartments,listUsers,setUserActive,updateUser,UserApiError } from "@/features/users/services/user-service";
import { emptyCreateUser,type CreateUserValues,type DepartmentOption,type EditUserValues,type ManagedUser } from "@/features/users/types/user";

type CurrentUser={role:"super_admin"|"department_admin"|"worker"};
export default function UsersPage(){
 const router=useRouter();
 const [currentUser,setCurrentUser]=useState<CurrentUser|null>(null);
 const [users,setUsers]=useState<ManagedUser[]>([]);
 const [departments,setDepartments]=useState<DepartmentOption[]>([]);
 const [loading,setLoading]=useState(true);
 const [includeInactive,setIncludeInactive]=useState(true);
 const [search,setSearch]=useState("");
 const [roleFilter,setRoleFilter]=useState("all");
 const [dialogOpen,setDialogOpen]=useState(false);
 const [editing,setEditing]=useState<ManagedUser|null>(null);
 const [createValues,setCreateValues]=useState<CreateUserValues>(emptyCreateUser);
 const [editValues,setEditValues]=useState<EditUserValues>({name:"",email:""});
 const [saving,setSaving]=useState(false);
 const [busyId,setBusyId]=useState<number|null>(null);
 const [pendingUser,setPendingUser]=useState<ManagedUser|null>(null);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const isSuperAdmin=currentUser?.role==="super_admin";

 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const [list,meResponse]=await Promise.all([listUsers(includeInactive),fetch("/api/auth/me",{cache:"no-store"})]);
   if(!meResponse.ok){if(meResponse.status===401){router.replace("/");return;}throw new Error("Unable to verify your account permissions.");}
   const me=await meResponse.json();setCurrentUser(me.user);setUsers(list);
   if(me.user?.role==="super_admin"){try{setDepartments(await listActiveDepartments());}catch{setDepartments([]);}}
  }catch(err){
   if(err instanceof UserApiError&&err.status===401){router.replace("/");return;}
   setError(err instanceof Error?err.message:"Unable to load users.");
  }finally{setLoading(false);}
 },[includeInactive,router]);
 useEffect(()=>{void load();},[load]);

 const filtered=useMemo(()=>{
  const term=search.trim().toLowerCase();
  return users.filter(u=>{
   const textMatch=!term||[u.name,u.email,String(u.department_id??"")].some(v=>v.toLowerCase().includes(term));
   return textMatch&&(roleFilter==="all"||u.role===roleFilter);
  });
 },[users,search,roleFilter]);

 function openCreate(){
  setEditing(null);setCreateValues({...emptyCreateUser,role:isSuperAdmin?"department_admin":"worker"});
  setEditValues({name:"",email:""});setError("");setDialogOpen(true);
 }
 function openEdit(user:ManagedUser){setEditing(user);setEditValues({name:user.name,email:user.email});setError("");setDialogOpen(true);}
 async function save(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(saving)return;setSaving(true);setError("");
  try{
   if(editing)await updateUser(editing.id,editValues);else await createUser(createValues);
   setDialogOpen(false);setNotice(editing?"User details updated successfully.":"User created successfully.");await load();
  }catch(err){setError(err instanceof Error?err.message:"Unable to save user.");}
  finally{setSaving(false);}
 }
 async function toggle(user:ManagedUser){
  setBusyId(user.id);setError("");setNotice("");
  try{await setUserActive(user.id,!user.is_active);setNotice(user.name+(user.is_active?" deactivated.":" activated."));await load();}
  catch(err){setError(err instanceof Error?err.message:"Unable to update user status.");}
  finally{setBusyId(null);}
 }
 async function confirmToggle(){if(!pendingUser)return;await toggle(pendingUser);setPendingUser(null);}

 return <>
  <div className="users-content">
   <div className="departments-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> ACCESS &amp; PERMISSIONS</span>
    <h1>User management<span>.</span></h1><p>Manage accounts and access across your organization.</p></div>
    <Button onClick={openCreate} leadingIcon="＋">Add user</Button></div>
   <div className="user-summary-strip">
    <div><span>VISIBLE ACCOUNTS</span><strong>{users.length}</strong></div>
    <div><span>ACTIVE ACCOUNTS</span><strong>{users.filter(u=>u.is_active).length}</strong></div>
    <div><span>INACTIVE ACCOUNTS</span><strong>{users.filter(u=>!u.is_active).length}</strong></div>
   </div>
   {notice&&<div className="department-alert success" role="status">{notice}</div>}
   {error&&!dialogOpen&&<div className="department-alert error" role="alert">{error}</div>}
   <section className="department-list-panel user-list-panel">
    <div className="department-list-heading"><div><h2>{isSuperAdmin?"All managed users":"Department workers"}</h2>
     <p>{isSuperAdmin?"Manage Department Admins and Workers across departments.":"Manage Workers assigned to your department."}</p></div>
     <label className="inactive-toggle"><input type="checkbox" checked={includeInactive} onChange={e=>setIncludeInactive(e.target.checked)}/> Show inactive</label></div>
    <div className="department-toolbar user-toolbar">
     <SearchField value={search} onChange={setSearch} placeholder="Search by name, email or department ID..." label="Search users"/>
     <select aria-label="Filter by role" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
      <option value="all">All roles</option>{isSuperAdmin&&<option value="department_admin">Department Admins</option>}<option value="worker">Workers</option>
     </select><span className="department-result-count">{filtered.length} users</span>
    </div>
    {loading?<LoadingState label="Loading users…"/>:error&&users.length===0?
     <ErrorState title="Unable to load users" description={error} action={<Button variant="secondary" onClick={()=>void load()}>Try again</Button>}/>:
     filtered.length===0?<EmptyState title={search||roleFilter!=="all"?"No matching users":"No users yet"}
      description={search||roleFilter!=="all"?"Change your search or filters and try again.":"Create the first managed account for this workspace."}
      action={!search?<Button variant="secondary" onClick={openCreate}>Create user</Button>:undefined}/>:
     <UserTable users={filtered} busyId={busyId} onEdit={openEdit} onToggle={setPendingUser}/>}
   </section>
   <p className="departments-footnote">Super Admins manage department accounts. Department Admins can manage Workers in their own department only.</p>
  </div>
  <UserFormModal open={dialogOpen} editing={editing} isSuperAdmin={Boolean(isSuperAdmin)} departments={departments}
   createValues={createValues} editValues={editValues} onCreateChange={setCreateValues} onEditChange={setEditValues}
   onClose={()=>{if(!saving)setDialogOpen(false);}} onSubmit={save} saving={saving} error={error}/>
  <ConfirmDialog open={pendingUser!==null} title={pendingUser?.is_active?"Deactivate user?":"Activate user?"}
   description={pendingUser?.is_active?pendingUser.name+" will no longer be able to sign in until reactivated.":"Reactivate "+(pendingUser?.name??"this user")+"?"}
   confirmLabel={pendingUser?.is_active?"Deactivate":"Activate"} destructive={Boolean(pendingUser?.is_active)}
   busy={busyId!==null} onCancel={()=>{if(busyId===null)setPendingUser(null);}} onConfirm={()=>void confirmToggle()}/>
 </>;
}
