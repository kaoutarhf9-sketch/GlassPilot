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

export default function ResetPasswordEmail({
  prenom = 'Utilisateur',
  resetLink = 'https://votredomaine.com/reinitialiser-mot-de-passe',
}) {
  return (
    <Html>
      <Head />
      <Preview>Réinitialisez votre mot de passe GlassPilot</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>GlassPilot</Heading>
          <Heading style={h2}>Réinitialisation de votre mot de passe</Heading>
          
          <Text style={text}>Bonjour {prenom},</Text>
          
          <Text style={text}>
            Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte GlassPilot. 
            Cliquer sur le bouton ci-dessous vous permettra de choisir un nouveau mot de passe sécurisé.
          </Text>

          <Section style={buttonContainer}>
            <Link href={resetLink} style={button}>
              Réinitialiser mon mot de passe
            </Link>
          </Section>

          <Text style={textSecondary}>
            Ce lien de récupération est à usage unique et expirera dans quelques heures. 
            Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité — votre mot de passe restera inchangé.
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
