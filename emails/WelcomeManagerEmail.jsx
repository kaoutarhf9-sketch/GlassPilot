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

export default function WelcomeManagerEmail({
  prenom = 'Jean',
  nom = 'Dupont',
  email = 'jean@exemple.com',
  password = 'MotDePasseTemp123!'
}) {
  return (
    <Html>
      <Head />
      <Preview>Vos accès gestionnaire pour GlassPilot</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bienvenue sur GlassPilot</Heading>
          
          <Text style={text}>Bonjour {prenom} {nom},</Text>
          
          <Text style={text}>
            Votre compte gestionnaire a été créé avec succès par un administrateur. 
            Vous pouvez dès à présent vous connecter pour gérer les dossiers des garagistes.
          </Text>

          <Section style={credentialsContainer}>
            <Text style={credentialText}>
              <strong>Identifiant (Email) :</strong> {email}
            </Text>
            <Text style={credentialText}>
              <strong>Mot de passe :</strong> {password}
            </Text>
          </Section>

          <Text style={text}>
            Nous vous recommandons de modifier ce mot de passe temporaire dès votre première connexion.
          </Text>

          <Section style={buttonContainer}>
            <Link href="https://votredomaine.com" style={button}>
              Se connecter à mon espace
            </Link>
          </Section>

          <Text style={footer}>
            Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.
            <br />
            L'équipe GlassPilot
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
};

const h1 = {
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 20px',
  padding: '0',
  textAlign: 'center',
};

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
};

const credentialsContainer = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '16px',
  margin: '24px 0',
};

const credentialText = {
  margin: '4px 0',
  color: '#0f172a',
  fontSize: '15px',
};

const buttonContainer = {
  textAlign: 'center',
  margin: '32px 0',
};

const button = {
  backgroundColor: '#1454FF',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center',
  padding: '12px 24px',
  display: 'inline-block',
};

const footer = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '32px 0 0',
  textAlign: 'center',
};
