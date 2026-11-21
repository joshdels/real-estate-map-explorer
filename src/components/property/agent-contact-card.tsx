import {
  Phone,
  ChatText,
  EnvelopeSimple,
  FacebookLogo,
  MessengerLogo,
} from "@phosphor-icons/react";
import type { Agent } from "@/lib/types";
import { isProductionMode } from "@/lib/runtime-mode";

/**
 * Compact "Call or text now" card for the lot's assigned specialist. Reads the
 * fictional sample agent from the dataset. Phone, text, and email use device
 * handlers; Facebook and Messenger open in a new tab. Shown only when an agent
 * with a name exists.
 */
export function AgentContactCard({ agent }: { agent?: Agent }) {
  if (!agent?.name) return null;

  const initials = (agent.initials || agent.name.replace(/^Sample\s+/i, "").slice(0, 2)).toUpperCase();
  const tel = agent.phoneHref || agent.phoneDisplay;

  return (
    <section className="agent-contact" aria-labelledby="agent-contact-title">
      <div className="agent-contact-inner">
        <p className="agent-contact-kicker" id="agent-contact-title">Call or text now</p>
        <div className="agent-contact-head">
          <span className="agent-contact-avatar" aria-hidden="true">{initials}</span>
          <div className="agent-contact-who">
            <strong>{agent.name}</strong>
            {agent.role ? <span className="agent-contact-role">{agent.role}</span> : null}
            {agent.phoneDisplay ? (
              <a className="agent-contact-phone" href={`tel:${tel}`}>{agent.phoneDisplay}</a>
            ) : null}
          </div>
        </div>
        {agent.tagline ? <p className="agent-contact-tagline">{agent.tagline}</p> : null}
        <div className="agent-contact-actions">
          {tel ? (
            <a className="agent-contact-action agent-contact-action-call" href={`tel:${tel}`}>
              <Phone aria-hidden="true" /> Call
            </a>
          ) : null}
          {tel ? (
            <a className="agent-contact-action" href={`sms:${tel}`}>
              <ChatText aria-hidden="true" /> Text
            </a>
          ) : null}
          {agent.email ? (
            <a className="agent-contact-action" href={`mailto:${agent.email}`}>
              <EnvelopeSimple aria-hidden="true" /> Email
            </a>
          ) : null}
          {agent.facebookUrl ? (
            <a
              className="agent-contact-action"
              href={agent.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FacebookLogo aria-hidden="true" /> Facebook
            </a>
          ) : null}
          {agent.messengerUrl ? (
            <a
              className="agent-contact-action"
              href={agent.messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessengerLogo aria-hidden="true" /> Messenger
            </a>
          ) : null}
        </div>
        {!isProductionMode ? <p className="agent-contact-note">Sample contact for this demo. Not a real person or number.</p> : null}
      </div>
    </section>
  );
}
