# Déploiement VPS

Deux briques **découplées**, à poser sur ton VPS :

| Dossier          | Rôle                                                  | Cycle de vie            |
| ---------------- | ----------------------------------------------------- | ----------------------- |
| `litellm/`       | Passerelle LLM partagée (OpenAI-compatible)           | service permanent       |
| `pipeline/`      | Job quotidien scrape → structure → embed → match      | one-shot, lancé par cron |

La base de données est sur **Supabase** (Postgres + pgvector) ; rien à héberger côté DB.

```
┌── VPS ───────────────────────────────────────────────┐
│  reverse-proxy ──(HTTPS)── litellm:4000  ◄─┐          │
│                                            │ llm-net  │
│  cron ──► docker compose run pipeline ─────┘          │
│              │                                        │
└──────────────┼────────────────────────────────────────┘
               └──(Internet)──► Supabase Postgres
                              └► OpenAI / DeepSeek
```

---

## 1. Réseau Docker partagé (une seule fois)

```bash
docker network create llm-net
```

## 2. LiteLLM (passerelle permanente)

```bash
cd deploy/litellm
cp .env.example .env
# Renseigne LITELLM_MASTER_KEY (openssl rand -hex 32), OPENAI_API_KEY, DEEPSEEK_API_KEY
docker compose up -d
docker compose logs -f   # vérifie le démarrage
```

Test rapide (depuis le VPS) :

```bash
curl -s http://127.0.0.1:4000/v1/models -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

### Exposition HTTPS (pour appeler LiteLLM hors VPS : web app cloud, laptop…)

Pointe ton reverse-proxy existant vers `127.0.0.1:4000`. Exemple **Caddy** :

```caddy
llm.tondomaine.com {
    reverse_proxy 127.0.0.1:4000
}
```

L'URL publique devient alors `https://llm.tondomaine.com/v1` (avec la clé maître).
Tant que la web app n'est pas déployée, cette étape est optionnelle.

## 3. Pipeline (job quotidien)

```bash
cd deploy/pipeline
cp .env.example .env
# Renseigne DATABASE_URL / DIRECT_URL (Supabase pooler) et LITELLM_API_KEY (= master key)
docker compose build
docker compose run --rm pipeline   # premier run manuel : applique les migrations + pipeline
```

Le premier run exécute `pnpm db:deploy` (migrations sur Supabase) puis le pipeline complet.

## 4. Planification (cron du VPS)

`crontab -e` (ou `/etc/cron.d/agentic-cv`) — exemple à 05:00 UTC :

```cron
0 5 * * * cd /opt/agentic-cv/deploy/pipeline && /usr/bin/docker compose run --rm pipeline >> /var/log/agentic-cv-pipeline.log 2>&1
```

Adapte le chemin (`/opt/agentic-cv`) et l'heure. Pour mettre à jour le code :
`git pull && docker compose build` dans `deploy/pipeline`.

---

## Notes

- **Cohérence des embeddings** : garde `LITELLM_EMBEDDING_MODEL=text-embedding-3-small`
  (1536 dim) — changer de modèle rendrait les vecteurs existants incomparables.
- **Sécurité** : LiteLLM n'est exposé qu'en `127.0.0.1` ; l'accès public passe par
  le reverse-proxy en HTTPS + clé maître. Ne commite jamais les fichiers `.env`.
- **Supabase / IPv4** : utilise bien les chaînes **pooler** (`*.pooler.supabase.com`) ;
  la connexion directe est souvent IPv6-only.
- **Web app** : quand tu la déploieras, réutilise la même passerelle —
  `LITELLM_BASE_URL` interne (`http://litellm:4000/v1`) si sur le VPS, sinon l'URL HTTPS.
