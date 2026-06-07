import { redirect } from "next/navigation";

// Les favoris et statuts ont migré vers la page dédiée « Mes VIE ».
export default function AccountOffersRedirectPage() {
  redirect("/mes-vie");
}
