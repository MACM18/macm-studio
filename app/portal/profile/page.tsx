import { requireClient } from "@/lib/auth-guards";
import { updateProfile } from "@/app/portal/actions";

export const metadata = { title: "Your profile | MACM", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const { user } = await requireClient();
  return (
    <section className="workspace-card workspace-panel-narrow">
      <div className="panel-heading"><div><span className="kicker">CONTACT DETAILS</span><h2>Keep your details current.</h2></div><p>Your sign-in email is managed by MACM and cannot be changed here.</p></div>
      <form action={updateProfile} className="workspace-form two-column-form">
        <label>Full name<input name="name" required defaultValue={user.name} /></label>
        <label>Company<input name="company" defaultValue={user.company ?? ""} /></label>
        <label>Phone<input name="phone" type="tel" defaultValue={user.phone ?? ""} /></label>
        <label>Sign-in email<input value={user.email} disabled aria-describedby="locked-email" /></label>
        <small id="locked-email">Ask MACM if your sign-in email needs to change.</small>
        <button className="button">Save profile</button>
      </form>
    </section>
  );
}
