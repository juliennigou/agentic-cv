# Deploiement du scraper quotidien avec systemd

Ce guide decrit une installation simple pour lancer le scraper Business France V.I.E une fois par jour sur un VPS.

## Principe

Le scheduler `systemd` ne contient pas de logique metier. Il declenche seulement la commande du worker:

```bash
pnpm scrape:business-france
```

La protection contre les doublons et les runs partiels est geree par l'application:

- creation d'un `scrape_run` a chaque lancement;
- verrou atomique en base via `scrape_locks`;
- expiration du verrou si le process meurt;
- upsert des offres par `source + externalId`;
- mise a jour de `lastSeenAt` a chaque observation;
- desactivation des offres absentes uniquement si le run termine en `success`.

## Variables d'environnement

Creer un fichier d'environnement sur le VPS, par exemple:

```bash
sudo mkdir -p /etc/agentic-cv
sudo nano /etc/agentic-cv/worker.env
```

Contenu minimal:

```env
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/agentic_cv?schema=public
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/agentic_cv?schema=public
```

Le fichier doit rester prive:

```bash
sudo chmod 600 /etc/agentic-cv/worker.env
```

## Preparation du projet

Depuis le dossier du repo sur le VPS:

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm --filter @agentic-cv/db exec prisma migrate deploy --schema prisma/schema.prisma
```

Sur une base neuve, cette commande applique la migration initiale. Si une base avait deja ete creee manuellement avec `prisma db push`, il faudra la baseliner avant d'utiliser `migrate deploy`, sinon Prisma tentera de recreer des tables existantes.

Tester une extraction sans ecriture en base:

```bash
pnpm scrape:business-france -- --dry-run --max-offers=3
```

Tester une vraie execution limitee:

```bash
pnpm scrape:business-france -- --max-offers=3 --no-deactivate-missing
```

Les executions limitees avec `--max-pages` ou `--max-offers` ne desactivent jamais les offres absentes, meme si `--no-deactivate-missing` est oublie.

## Service systemd

Creer `/etc/systemd/system/agentic-cv-scraper.service`:

```ini
[Unit]
Description=Agentic CV daily Business France VIE scraper
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
WorkingDirectory=/opt/agentic-cv
EnvironmentFile=/etc/agentic-cv/worker.env
ExecStart=/usr/bin/env pnpm scrape:business-france
TimeoutStartSec=2h
```

Adapter `WorkingDirectory` au chemin reel du repo sur le VPS.

## Timer systemd

Creer `/etc/systemd/system/agentic-cv-scraper.timer`:

```ini
[Unit]
Description=Run Agentic CV scraper once per day

[Timer]
OnCalendar=*-*-* 06:15:00
Persistent=true
RandomizedDelaySec=15m
Unit=agentic-cv-scraper.service

[Install]
WantedBy=timers.target
```

`Persistent=true` relance le job au prochain demarrage si le VPS etait eteint a l'heure prevue. `RandomizedDelaySec` evite de taper l'API exactement a la meme seconde tous les jours.

## Activation

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now agentic-cv-scraper.timer
sudo systemctl list-timers agentic-cv-scraper.timer
```

Lancer manuellement:

```bash
sudo systemctl start agentic-cv-scraper.service
```

Lire les logs:

```bash
journalctl -u agentic-cv-scraper.service -n 100 --no-pager
```

## Comportement attendu

Si un autre scrape est deja en cours, le nouveau lancement passe en `skipped` et n'ecrit aucune offre.

Si Business France renvoie une erreur reseau ou change son API, le run passe en `failed`. Dans ce cas, les offres absentes ne sont pas desactivees.

Si quelques offres detail echouent mais que le scraping continue, le run passe en `partial_success`. Les offres absentes ne sont pas desactivees non plus.

Seul un run `success` peut desactiver les offres qui n'ont pas ete revues.
