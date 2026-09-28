import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from '@react-email/components';
import * as React from 'react';

export default function ConfirmSignupEmail({
  prenom = 'Partenaire',
  nom_garage = 'votre garage',
  confirmLink = 'https://votredomaine.com/connexion',
}) {
  return (
    <Html>
      <Head />
      <Preview>Confirmez votre inscription sur GlassPilot</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>GlassPilot</Heading>
          <Heading style={h2}>Confirmation de votre inscription</Heading>
          
          <Text style={text}>Bonjour {prenom},</Text>
          
          <Text style={text}>
            Merci pour votre inscription sur GlassPilot pour le garage <strong>{nom_garage}</strong>. 
            Veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous pour activer votre compte.
          </Text>

          <Section style={buttonContainer}>
            <Link href={confirmLink} style={button}>
              Confirmer mon adresse email
            </Link>
          </Section>
          
          <Text style={textSecondary}>
            Si le bouton ne s'affiche pas ou ne fonctionne pas, vous pouvez copier et coller ce lien complet dans votre navigateur :
            <br />
            <br />
            <Link href={confirmLink} style={{ color: '#1454FF', wordBreak: 'break-all' }}>
              {confirmLink}
            </Link>
          </Text>

          <Text style={textSecondary}>
            Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.
          </Text>

          <Text style={footer}>
            Si vous rencontrez des difficultés, veuillez contacter notre équipe support.
            <br />
            L'équipe GlassPilot
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#F8FAFC', // Matching new theme shade
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 30px',
  borderRadius: '16px',
  boxShadow: '0 4px 16px rgba(24, 23, 15, 0.05)',
  maxWidth: '520px',
  border: '1px solid #E2E8F0',
};

const h1 = {
  color: '#18170F',
  fontSize: '28px',
  fontWeight: '800',
  margin: '0 0 10px',
  padding: '0',
  textAlign: 'center',
  letterSpacing: '-0.02em',
};

const h2 = {
  color: '#3A3830',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 24px',
  padding: '0',
  textAlign: 'center',
};

const text = {
  color: '#18170F',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 20px',
};

const textSecondary = {
  color: '#89867A',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '24px 0 0',
  borderTop: '1px solid #E2E8F0',
  paddingTop: '20px',
};

const buttonContainer = {
  textAlign: 'center',
  margin: '32px 0',
};

const button = {
  backgroundColor: '#1454FF',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '15px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center',
  padding: '14px 28px',
  display: 'inline-block',
  boxShadow: '0 4px 14px rgba(20, 84, 255, 0.25)',
};

const footer = {
  color: '#89867A',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '32px 0 0',
  textAlign: 'center',
};
