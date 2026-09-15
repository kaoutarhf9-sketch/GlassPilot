"use client";

import { useState } from "react";

export default function CreateGestionnairePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const createGestionnaire = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/create-gestionnaire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "gestionnaire@glasspilot.fr",
          prenom: "Jean",
          nom: "Dupont",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data);
      }
    } catch (err) {
      setError({
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Création Gestionnaire
        </h1>

        <button
          onClick={createGestionnaire}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
        >
          {loading
            ? "Création en cours..."
            : "Créer le gestionnaire"}
        </button>

        {result && (
          <div className="mt-6 bg-green-100 p-4 rounded-xl">
            <p className="font-bold text-green-700">
              ✅ {result.message}
            </p>

            <div className="mt-2 text-sm">
              <p>Email : {result.user.email}</p>
              <p>ID : {result.user.id}</p>
              <p>Mot de passe : Gestionnaire123!</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-100 p-4 rounded-xl">
            <p className="font-bold text-red-700">
              ❌ {error.error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}