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

export default function WelcomeGarageEmail({
  prenom = 'Jean',
  nom_garage = 'AutoGlass Pro',
  email = 'contact@mon-centre.fr',
  password = 'MotDePasseTemp123!'
}) {
  return (
    <Html>
      <Head />
      <Preview>Vos accès GlassPilot Pro pour votre garage {nom_garage}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bienvenue sur GlassPilot Pro</Heading>
          
          <Text style={text}>Bonjour {prenom},</Text>
          
          <Text style={text}>
            Votre compte professionnel pour le garage <strong>{nom_garage}</strong> a été créé avec succès par notre administrateur.
            Vous pouvez dès à présent vous connecter pour gérer vos dossiers de vitrage, vos clients et vos cessions de créances.
          </Text>

          <Section style={credentialsContainer}>
            <Text style={credentialText}>
              <strong>Identifiant (Email) :</strong> {email}
            </Text>
            <Text style={credentialText}>
              <strong>Mot de passe temporaire :</strong> {password}
            </Text>
          </Section>

          <Text style={text}>
            Lors de votre première connexion, il vous sera demandé de compléter vos documents d'activation réglementaires (SIRET, KBIS, RIB et carte bancaire de garantie) afin de déverrouiller l'accès complet à votre tableau de bord.
          </Text>

          <Text style={text}>
            Nous vous recommandons de modifier votre mot de passe temporaire dès que vous serez connecté à votre espace.
          </Text>

          <Section style={buttonContainer}>
            <Link href="https://votredomaine.com" style={button}>
              Activer mon espace Pro
            </Link>
          </Section>

          <Text style={footer}>
            Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email ou contacter notre service support.
            <br />
            L'équipe GlassPilot Pro
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
  color: '#18170F',
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
  color: '#18170F',
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
