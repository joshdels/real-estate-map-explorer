import Link from "next/link";
import { Buildings, ChartLineUp, MapTrifold } from "@phosphor-icons/react/dist/ssr";
import { brand } from "@/lib/brand";

export function BecomeProvider() {
  return (
    <>
      <section className="provider-hero page-section" aria-labelledby="provider-title">
        <div>
          <p className="section-kicker">Your land business, clearly presented</p>
          <h1 id="provider-title">You know the land. We help buyers understand each lot plan.</h1>
          <p className="section-lead">You lead the listing. Open Lot Plans gives you the map, tools, and support to reach land buyers and stay in control.</p>
          <div className="provider-actions">
            <Link className="primary-action" href="/dashboard">Create a provider profile</Link>
            <a className="secondary-action" href="/list-property">List a lot plan</a>
          </div>
        </div>
        <div className="provider-hero-note">
          <strong>You are the provider. We are the guide.</strong>
          <p>Bring your knowledge of the land. We will help you present its lot plan, development potential, access, and availability in one place.</p>
        </div>
      </section>

      <section className="page-section provider-benefits" aria-labelledby="provider-benefits-title">
        <p className="section-kicker">Tools that support your work</p>
        <h2 id="provider-benefits-title">More visibility with less listing work</h2>
        <div className="provider-benefit-grid">
          <article><MapTrifold aria-hidden="true" /><h3>Be easy to find</h3><p>Place each available parcel on the map so buyers can understand its location and lot shape.</p></article>
          <article><Buildings aria-hidden="true" /><h3>Present it clearly</h3><p>Bring the price, lot plan, area, access, utilities, photos, and availability into one listing.</p></article>
          <article><ChartLineUp aria-hidden="true" /><h3>Stay in control</h3><p>Organize lots by development, update their status, and choose which listings to feature.</p></article>
        </div>
      </section>

      <section className="page-section provider-steps" aria-labelledby="provider-steps-title">
        <div><p className="section-kicker">A clear path forward</p><h2 id="provider-steps-title">From seller profile to visible lot plan</h2></div>
        <ol>
          <li><span>01</span><div><strong>Create your profile</strong><p>Tell buyers whether you are an owner, broker, or developer.</p></div></li>
          <li><span>02</span><div><strong>Present the lot plan</strong><p>Add accurate land details, useful media, and its approximate boundary on the map.</p></div></li>
          <li><span>03</span><div><strong>Manage what buyers see</strong><p>Keep availability current and highlight the development land you want noticed.</p></div></li>
        </ol>
      </section>

      <section className="page-section provider-final" aria-labelledby="provider-final-title">
        <div><p className="section-kicker">Take the lead</p><h2 id="provider-final-title">Create your provider profile</h2><p>This demo stores profile and listing changes in the configured data provider or this browser. It is not a secure production account.</p></div>
        <Link className="primary-action" href="/dashboard">Open provider setup</Link>
      </section>
      <p className="sample-band" role="note">{brand.sampleNotice}</p>
    </>
  );
}
