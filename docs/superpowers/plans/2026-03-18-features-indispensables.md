# MAESTROMIND — Features Indispensables — Plan d'Implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter 9 fonctionnalités qui rendent l'app indispensable pour particuliers ET artisans.

**Architecture:** Tout dans `src/App.jsx` (monolithe React 19). Chaque feature = nouveaux states + nouvelle fonction API + nouveau bloc JSX. Aucun fichier externe créé.

**Tech Stack:** React 19, Vite 8, jsPDF, Claude Sonnet API directe navigateur, Web Speech API, localStorage

---

## Fichier unique modifié

- **Modify:** `src/App.jsx` — toutes les 9 features dans ce fichier

---

### Task 1 : Input Vocal — Micro dans le chat

**Fonctionnalité :** Bouton 🎤 dans la barre de saisie du chat. Clic → SpeechRecognition fr-FR → transcription auto dans l'input.

**Nouveau state :**
```js
const [voiceActive, setVoiceActive] = useState(false);
```

**Nouveau ref :**
```js
const voiceRef = useRef(null);
```

**Nouvelle fonction :**
```js
const startVoice = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert("Reconnaissance vocale non supportée sur ce navigateur."); return; }
  const rec = new SR();
  rec.lang = "fr-FR"; rec.continuous = false; rec.interimResults = false;
  voiceRef.current = rec;
  rec.onstart = () => setVoiceActive(true);
  rec.onresult = e => { setInput(prev => prev + (prev?" ":"") + e.results[0][0].transcript); setVoiceActive(false); };
  rec.onerror = () => setVoiceActive(false);
  rec.onend = () => setVoiceActive(false);
  rec.start();
};
```

**JSX — ajouter avant le bouton send dans inputBar :**
```jsx
<button onClick={startVoice} style={{ width:38, height:38, borderRadius:"50%", border:"0.5px solid "+(voiceActive?"rgba(224,82,82,0.6)":"rgba(201,168,76,0.22)"), background:voiceActive?"rgba(224,82,82,0.15)":"rgba(201,168,76,0.06)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, animation:voiceActive?"voicePulse 0.8s ease-in-out infinite":"none" }}>
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={voiceActive?"#E05252":"#C9A84C"} strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
</button>
```

**Animation à ajouter dans le bloc `<style>` :**
```css
@keyframes voicePulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(224,82,82,0.4); }
  50% { box-shadow: 0 0 0 8px rgba(224,82,82,0); }
}
```

- [ ] Ajouter state voiceActive
- [ ] Ajouter ref voiceRef
- [ ] Ajouter fonction startVoice
- [ ] Ajouter animation CSS voicePulse dans <style>
- [ ] Insérer bouton micro dans inputBar (avant le bouton send)
- [ ] `npm run build` → vérifier OK

---

### Task 2 : Contre-Devis Négocié (Particulier)

**Fonctionnalité :** Après analyse d'un devis, bouton "Négocier ce devis". L'IA génère un contre-devis ligne par ligne avec arguments + message à envoyer à l'artisan.

**Nouveaux states :**
```js
const [counterDevis, setCounterDevis] = useState(null);
const [counterLoading, setCounterLoading] = useState(false);
```

**Nouvelle fonction :**
```js
const genererContreDevis = async () => {
  if (!devisResult || !devisText.trim() || !apiKey) return;
  setCounterLoading(true); setCounterDevis(null);
  try {
    const r = await withRetry(() => fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1400,
        system:`Tu es un expert en négociation de travaux en France. Génère un contre-devis argumenté. Réponds UNIQUEMENT en JSON valide : {"lignes":[{"poste":"nom","prix_demande":"X€","prix_negocie":"X€","argument":"court argument"}],"economie_totale":"X€","message_negociation":"message poli à envoyer à l artisan en 2-3 phrases","conseil":"conseil final"}`,
        messages:[{role:"user", content:"Devis original :\n"+devisText+"\n\nAnalyse :\n"+JSON.stringify(devisResult)+"\n\nGénère le contre-devis."}] })}));
    const data = await r.json(); if(data.error) throw new Error(data.error.message);
    setCounterDevis(JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim()));
  } catch(e) { setCounterDevis({lignes:[],economie_totale:"0€",message_negociation:e.message,conseil:""}); }
  finally { setCounterLoading(false); }
};
```

**JSX — ajouter après le bloc `devisResult && (...)` dans le tab Devis :**
```jsx
{devisResult && !counterDevis && (
  <button style={counterLoading?{...s.greenBtn,opacity:0.5}:{...s.greenBtn,borderColor:"rgba(232,135,58,0.45)",color:"#E8873A"}} onClick={genererContreDevis} disabled={counterLoading}>
    {counterLoading?"Génération en cours...":"✍️ Négocier ce devis (contre-devis IA)"}
  </button>
)}
{counterDevis && (
  <div style={{marginTop:14}}>
    <div style={{fontSize:9,color:"#E8873A",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>CONTRE-DEVIS NÉGOCIÉ</div>
    {counterDevis.lignes.map((l,i)=>(
      <div key={i} style={{...s.card,marginBottom:7,borderColor:"rgba(232,135,58,0.15)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
          <div style={{fontSize:12,fontWeight:600,flex:1,marginRight:8}}>{l.poste}</div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:10,color:"rgba(240,237,230,0.35)",textDecoration:"line-through"}}>{l.prix_demande}</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:800,color:"#52C37A"}}>{l.prix_negocie}</div>
          </div>
        </div>
        <div style={{fontSize:10,color:"rgba(240,237,230,0.5)",lineHeight:1.5}}>💬 {l.argument}</div>
      </div>
    ))}
    <div style={{...s.card,background:"rgba(82,195,122,0.06)",borderColor:"rgba(82,195,122,0.2)",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:12,color:"rgba(240,237,230,0.7)"}}>Économie potentielle</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"#52C37A"}}>{counterDevis.economie_totale}</div>
      </div>
    </div>
    <div style={{...s.card,background:"rgba(82,144,224,0.05)",borderColor:"rgba(82,144,224,0.2)",marginBottom:10}}>
      <div style={{fontSize:10,color:"#5290E0",fontWeight:700,marginBottom:6}}>MESSAGE À ENVOYER À L'ARTISAN</div>
      <div style={{fontSize:12,color:"rgba(240,237,230,0.7)",lineHeight:1.7,fontStyle:"italic"}}>"{counterDevis.message_negociation}"</div>
    </div>
    {counterDevis.conseil&&<div style={{fontSize:11,color:"rgba(240,237,230,0.45)",lineHeight:1.6}}>💡 {counterDevis.conseil}</div>}
    <button onClick={()=>setCounterDevis(null)} style={{...s.greenBtn,marginTop:8,background:"rgba(255,255,255,0.03)",borderColor:"rgba(255,255,255,0.1)",color:"rgba(240,237,230,0.4)"}}>← Nouvelle analyse</button>
  </div>
)}
```

- [ ] Ajouter states counterDevis, counterLoading
- [ ] Ajouter fonction genererContreDevis
- [ ] Ajouter JSX bouton + résultat contre-devis dans tab Devis
- [ ] `npm run build` → OK

---

### Task 3 : Planning Chantier IA (Particulier)

**Fonctionnalité :** Onglet "Planning" dans Outils. L'utilisateur saisit type de projet + budget → l'IA génère le planning semaine par semaine avec tâches, matériaux à commander, points critiques.

**Nouveaux states :**
```js
const [planningType, setPlanningType] = useState("Rénovation salle de bain");
const [planningBudget, setPlanningBudget] = useState("5000");
const [planningResult, setPlanningResult] = useState(null);
const [planningLoading, setPlanningLoading] = useState(false);
```

**Nouvelle fonction :**
```js
const planifierChantier = async () => {
  if (!apiKey) return;
  setPlanningLoading(true); setPlanningResult(null);
  try {
    const r = await withRetry(() => fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1400,
        system:`Tu es expert en planification de chantier. Réponds UNIQUEMENT en JSON valide : {"duree_totale":"X semaines","semaines":[{"numero":1,"titre":"Semaine 1 — Titre","taches":["tâche 1","tâche 2"],"materiaux_a_commander":["matériau 1"],"attention":"point critique de la semaine"}],"ordre_metiers":["1. Corps de métier","2. ..."],"conseils":"conseil global","budget_detail":"répartition budget"}`,
        messages:[{role:"user",content:"Projet : "+planningType+", budget "+planningBudget+"€. Planning complet semaine par semaine avec dépendances et délais de séchage."}] })}));
    const data = await r.json(); if(data.error) throw new Error(data.error.message);
    setPlanningResult(JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim()));
  } catch(e) { setPlanningResult({duree_totale:"?",semaines:[],ordre_metiers:[],conseils:e.message,budget_detail:""}); }
  finally { setPlanningLoading(false); }
};
```

**JSX — nouveau tab "Planning" dans Outils (après tab DPE) :**
Voir section "Ajout tabs outils" — tab key="planning" label="Planning"

```jsx
{toolTab === "planning" && <div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
    <div>
      <div style={{fontSize:9,color:"rgba(240,237,230,0.38)",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Type de projet</div>
      <select style={s.inp} value={planningType} onChange={e=>setPlanningType(e.target.value)}>
        {["Rénovation salle de bain","Rénovation cuisine","Isolation combles","Isolation murs","Pose carrelage","Cloison BA13","Peinture appartement","Rénovation complète","Installation électrique","Plomberie sanitaires"].map(t=><option key={t}>{t}</option>)}
      </select>
    </div>
    <div>
      <div style={{fontSize:9,color:"rgba(240,237,230,0.38)",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Budget €</div>
      <input style={s.inp} type="number" value={planningBudget} onChange={e=>setPlanningBudget(e.target.value)} />
    </div>
  </div>
  <button style={planningLoading?{...s.greenBtn,opacity:0.5}:s.greenBtn} onClick={planifierChantier} disabled={planningLoading}>
    {planningLoading?"Planification en cours...":"📅 Générer le planning chantier"}
  </button>
  {planningResult && <div style={{marginTop:14}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800}}>{planningResult.duree_totale}</div>
      <div style={{fontSize:11,color:"rgba(240,237,230,0.5)"}}>· {planningType}</div>
    </div>
    {planningResult.semaines.map((sem,i)=>(
      <div key={i} style={{...s.card,marginBottom:9,borderLeft:"2.5px solid #C9A84C"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span style={{fontSize:9,padding:"2px 8px",borderRadius:20,background:"linear-gradient(135deg,#EDD060,#C9A84C)",color:"#06080D",fontWeight:800}}>S{sem.numero}</span>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700}}>{sem.titre}</div>
        </div>
        {sem.taches.map((t,j)=><div key={j} style={{display:"flex",gap:7,marginBottom:5}}><div style={{width:16,height:16,borderRadius:4,background:"rgba(82,195,122,0.1)",border:"0.5px solid rgba(82,195,122,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#52C37A",flexShrink:0}}>✓</div><div style={{fontSize:11,color:"rgba(240,237,230,0.6)"}}>{t}</div></div>)}
        {sem.materiaux_a_commander?.length>0&&<div style={{marginTop:8,paddingTop:8,borderTop:"0.5px solid rgba(255,255,255,0.06)"}}>
          <div style={{fontSize:9,color:"#C9A84C",fontWeight:700,marginBottom:4}}>🛒 À COMMANDER</div>
          {sem.materiaux_a_commander.map((m,j)=><div key={j} style={{fontSize:10,color:"rgba(240,237,230,0.45)",marginBottom:2}}>→ {m}</div>)}
        </div>}
        {sem.attention&&<div style={{marginTop:8,padding:"6px 9px",borderRadius:8,background:"rgba(232,135,58,0.08)",border:"0.5px solid rgba(232,135,58,0.25)",fontSize:10,color:"#E8873A"}}>⚠️ {sem.attention}</div>}
      </div>
    ))}
    {planningResult.ordre_metiers?.length>0&&<div style={{...s.card,marginBottom:9}}>
      <div style={{fontSize:9,color:"#C9A84C",fontWeight:700,marginBottom:8}}>ORDRE DES CORPS DE MÉTIER</div>
      {planningResult.ordre_metiers.map((m,i)=><div key={i} style={{fontSize:11,color:"rgba(240,237,230,0.6)",marginBottom:4}}>{m}</div>)}
    </div>}
    {planningResult.budget_detail&&<div style={{fontSize:11,color:"rgba(240,237,230,0.45)",marginBottom:8,lineHeight:1.6}}>💶 {planningResult.budget_detail}</div>}
    {planningResult.conseils&&<div style={{fontSize:11,color:"rgba(240,237,230,0.45)",lineHeight:1.6}}>💡 {planningResult.conseils}</div>}
  </div>}
</div>}
```

- [ ] Ajouter states planning*
- [ ] Ajouter fonction planifierChantier
- [ ] Ajouter tab "planning"/"Planning" dans la liste des tabs Outils
- [ ] Ajouter JSX du tab Planning
- [ ] `npm run build` → OK

---

### Task 4 : Générateur Devis Pro PDF (Artisan)

**Fonctionnalité :** Onglet "Devis Pro" dans Outils (visible pour tous). L'artisan décrit les travaux → l'IA génère un devis professionnel structuré avec DTU → PDF téléchargeable.

**Nouveaux states :**
```js
const [devisProDesc, setDevisProDesc] = useState("");
const [devisProClient, setDevisProClient] = useState("");
const [devisProSurface, setDevisProSurface] = useState("20");
const [devisProResult, setDevisProResult] = useState(null);
const [devisProLoading, setDevisProLoading] = useState(false);
```

**Nouvelle fonction genererDevisPro :**
```js
const genererDevisPro = async () => {
  if (!devisProDesc.trim() || !apiKey) return;
  setDevisProLoading(true); setDevisProResult(null);
  try {
    const r = await withRetry(() => fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1600,
        system:`Tu es expert en rédaction de devis travaux France 2025. Génère un devis professionnel. Réponds UNIQUEMENT en JSON valide : {"lignes":[{"description":"description précise","unite":"m² ou U ou ml ou forfait","quantite":"X","prix_unitaire":"X€","total":"X€","dtu":"DTU ou norme applicable"}],"sous_total_ht":"X€","tva_taux":"10%","tva":"X€","total_ttc":"X€","validite":"30 jours","garanties":"décennale 10 ans + parfait achèvement 1 an + bon fonctionnement 2 ans","mentions":"TVA applicable selon art. 279-0 bis du CGI — Travaux d'amélioration, de transformation ou d'entretien des locaux à usage d'habitation achevés depuis plus de 2 ans"}`,
        messages:[{role:"user",content:"Travaux : "+devisProDesc+"\nSurface : "+devisProSurface+"m²\nClient : "+(devisProClient||"À compléter")+"\nGénère le devis complet avec prix marché France 2025."}] })}));
    const data = await r.json(); if(data.error) throw new Error(data.error.message);
    setDevisProResult(JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim()));
  } catch(e) { setDevisProResult({lignes:[],sous_total_ht:"0€",tva_taux:"10%",tva:"0€",total_ttc:"0€",validite:"30 jours",garanties:"",mentions:""}); }
  finally { setDevisProLoading(false); }
};
```

**Nouvelle fonction genererDevisProPDF :**
```js
const genererDevisProPDF = () => {
  if (!devisProResult) return;
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  const W=210, H=297;
  const dateStr = new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
  const num = "DEV-"+new Date().getFullYear()+"-"+Math.random().toString(36).substr(2,6).toUpperCase();
  doc.setFillColor(6,8,13); doc.rect(0,0,W,H,"F");
  doc.setFillColor(201,168,76); doc.rect(0,0,5,H,"F"); doc.rect(0,0,W,1.5,"F");
  doc.setFillColor(10,14,22); doc.rect(5,1.5,W-5,50,"F");
  doc.setFillColor(201,168,76); doc.roundedRect(14,10,22,22,3,3,"F");
  doc.setTextColor(6,8,13); doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.text("B",25,26,{align:"center"});
  doc.setTextColor(240,237,230); doc.setFontSize(17); doc.setFont("helvetica","bold"); doc.text("DEVIS PROFESSIONNEL",42,20);
  doc.setTextColor(201,168,76); doc.setFontSize(8); doc.text("N° "+num,42,28);
  doc.setTextColor(100,96,88); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
  doc.text("Émis le "+dateStr+"  ·  Validité : "+(devisProResult.validite||"30 jours"),42,35);
  if(devisProClient) doc.text("Client : "+devisProClient,42,42);
  doc.setDrawColor(201,168,76); doc.setLineWidth(0.3); doc.line(5,52,W,52);
  doc.setFillColor(14,18,28); doc.rect(5,53,W-5,10,"F");
  doc.setTextColor(201,168,76); doc.setFontSize(7); doc.setFont("helvetica","bold");
  doc.text("DÉSIGNATION",14,60); doc.text("UNITÉ",102,60,{align:"center"}); doc.text("QTÉ",122,60,{align:"center"}); doc.text("PU HT",147,60,{align:"center"}); doc.text("TOTAL HT",W-12,60,{align:"right"});
  let y=68;
  (devisProResult.lignes||[]).forEach((l,i)=>{
    const desc=l.dtu?l.description+" ("+l.dtu+")":l.description;
    const lines=doc.splitTextToSize(desc,82);
    const rowH=Math.max(10,lines.length*5+4);
    if(i%2===0){doc.setFillColor(10,13,20);doc.rect(5,y-2,W-5,rowH,"F");}
    doc.setTextColor(240,237,230); doc.setFontSize(8); doc.setFont("helvetica","normal");
    doc.text(lines,14,y+3);
    doc.setTextColor(180,175,165); doc.text(l.unite||"",102,y+3,{align:"center"});
    doc.text(String(l.quantite||""),122,y+3,{align:"center"});
    doc.text(l.prix_unitaire||"",147,y+3,{align:"center"});
    doc.setTextColor(201,168,76); doc.setFont("helvetica","bold");
    doc.text(l.total||"",W-12,y+3,{align:"right"});
    y+=rowH;
  });
  y=Math.min(y+8,225);
  doc.setDrawColor(201,168,76); doc.line(120,y,W-5,y);
  doc.setTextColor(160,155,148); doc.setFontSize(8); doc.setFont("helvetica","normal");
  doc.text("Sous-total HT",130,y+7); doc.text(devisProResult.sous_total_ht||"",W-12,y+7,{align:"right"});
  doc.text("TVA "+devisProResult.tva_taux,130,y+14); doc.text(devisProResult.tva||"",W-12,y+14,{align:"right"});
  doc.setFillColor(14,18,28); doc.roundedRect(120,y+17,W-125,12,2,2,"F");
  doc.setDrawColor(201,168,76); doc.setLineWidth(0.5); doc.roundedRect(120,y+17,W-125,12,2,2,"S");
  doc.setTextColor(201,168,76); doc.setFontSize(10); doc.setFont("helvetica","bold");
  doc.text("TOTAL TTC",130,y+26); doc.text(devisProResult.total_ttc||"",W-12,y+26,{align:"right"});
  const yM=Math.min(y+38,248);
  doc.setFillColor(8,10,16); doc.roundedRect(14,yM,W-28,28,2,2,"F");
  doc.setDrawColor(35,45,62); doc.setLineWidth(0.2); doc.roundedRect(14,yM,W-28,28,2,2,"S");
  doc.setTextColor(201,168,76); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text("GARANTIES & MENTIONS LÉGALES",22,yM+7);
  doc.setTextColor(110,106,98); doc.setFontSize(6.5); doc.setFont("helvetica","normal");
  doc.text(doc.splitTextToSize((devisProResult.garanties||"")+" — "+(devisProResult.mentions||""),W-52),22,yM+14);
  doc.setDrawColor(40,50,68); doc.setLineWidth(0.3);
  doc.line(18,270,82,270); doc.line(128,270,192,270);
  doc.setTextColor(100,96,88); doc.setFontSize(7); doc.setFont("helvetica","normal");
  doc.text("Signature artisan",50,275,{align:"center"}); doc.text("Signature client + «Bon pour accord»",160,275,{align:"center"});
  doc.setFillColor(10,14,22); doc.rect(0,278,W,19,"F");
  doc.setFillColor(201,168,76); doc.rect(0,278,5,19,"F"); doc.rect(0,295.5,W,1.5,"F");
  doc.setTextColor(201,168,76); doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.text("MAESTROMIND",13,286);
  doc.setTextColor(80,76,70); doc.setFontSize(7); doc.setFont("helvetica","normal");
  doc.text("Devis généré par IA · À compléter avec les coordonnées artisan",13,292);
  doc.text("N° "+num,W-12,286,{align:"right"});
  doc.text("Validité : "+(devisProResult.validite||"30 jours"),W-12,292,{align:"right"});
  doc.save("devis-pro-"+num+".pdf");
};
```

**JSX — nouveau tab "Devis Pro" :**
```jsx
{toolTab === "devis_pro" && <div>
  <div style={{fontSize:9,color:"#E8873A",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>GÉNÉRATEUR DEVIS ARTISAN</div>
  <div style={{marginBottom:8}}>
    <div style={{fontSize:9,color:"rgba(240,237,230,0.38)",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Décrivez les travaux</div>
    <textarea style={{...s.ci,width:"100%",minHeight:100,borderRadius:12,padding:"10px 14px",marginBottom:0,lineHeight:1.6}} value={devisProDesc} onChange={e=>setDevisProDesc(e.target.value)} placeholder="Ex: Pose carrelage salle de bain 8m², dépose ancien revêtement, fourniture et pose faïence murs + sol..." />
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
    <div>
      <div style={{fontSize:9,color:"rgba(240,237,230,0.38)",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Client</div>
      <input style={s.inp} value={devisProClient} onChange={e=>setDevisProClient(e.target.value)} placeholder="Nom du client" />
    </div>
    <div>
      <div style={{fontSize:9,color:"rgba(240,237,230,0.38)",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Surface m²</div>
      <input style={s.inp} type="number" value={devisProSurface} onChange={e=>setDevisProSurface(e.target.value)} />
    </div>
  </div>
  <button style={devisProLoading?{...s.greenBtn,opacity:0.5,borderColor:"rgba(232,135,58,0.4)",color:"#E8873A"}:{...s.greenBtn,borderColor:"rgba(232,135,58,0.45)",color:"#E8873A"}} onClick={genererDevisPro} disabled={devisProLoading}>
    {devisProLoading?"Génération en cours...":"📄 Générer le devis professionnel"}
  </button>
  {devisProResult && <div style={{marginTop:12}}>
    <div style={{...s.card,background:"rgba(201,168,76,0.05)",borderColor:"rgba(201,168,76,0.25)",marginBottom:10}}>
      {(devisProResult.lignes||[]).map((l,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"7px 0",borderBottom:i<devisProResult.lignes.length-1?"0.5px solid rgba(255,255,255,0.05)":"none"}}>
        <div style={{flex:1,marginRight:10}}>
          <div style={{fontSize:11,fontWeight:500}}>{l.description}</div>
          {l.dtu&&<div style={{fontSize:9,color:"#C9A84C",marginTop:1}}>{l.dtu}</div>}
          <div style={{fontSize:9,color:"rgba(240,237,230,0.38)"}}>{l.quantite} {l.unite} × {l.prix_unitaire}</div>
        </div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:"#C9A84C",flexShrink:0}}>{l.total}</div>
      </div>)}
      <div style={{display:"flex",justifyContent:"space-between",paddingTop:10,marginTop:6,borderTop:"0.5px solid rgba(201,168,76,0.2)"}}>
        <div style={{fontSize:12,color:"rgba(240,237,230,0.5)"}}>Total TTC</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"#C9A84C"}}>{devisProResult.total_ttc}</div>
      </div>
    </div>
    <button style={s.dlBtn} onClick={genererDevisProPDF}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Télécharger le devis PDF
    </button>
    <button onClick={()=>{setDevisProResult(null);setDevisProDesc("");}} style={{...s.greenBtn,marginTop:8,background:"rgba(255,255,255,0.03)",borderColor:"rgba(255,255,255,0.1)",color:"rgba(240,237,230,0.4)"}}>← Nouveau devis</button>
  </div>}
</div>}
```

- [ ] Ajouter states devisPro*
- [ ] Ajouter fonction genererDevisPro
- [ ] Ajouter fonction genererDevisProPDF
- [ ] Ajouter tab "devis_pro"/"Devis Pro" dans liste tabs Outils
- [ ] Ajouter JSX du tab Devis Pro
- [ ] `npm run build` → OK

---

### Task 5 : Calculateur de Rentabilité (Artisan)

**Fonctionnalité :** Onglet "Rentabilité" dans Outils. L'artisan rentre surface + taux horaire + coût matériaux + déplacements → calcul instantané de sa marge nette.

**Nouveaux states :**
```js
const [rentaSurface, setRentaSurface] = useState("50");
const [rentaTaux, setRentaTaux] = useState("45");
const [rentaMat, setRentaMat] = useState("3000");
const [rentaDep, setRentaDep] = useState("150");
const [rentaResult, setRentaResult] = useState(null);
```

**Nouvelle fonction (pas d'API, calcul local) :**
```js
const calculerRentabilite = () => {
  const surf=parseFloat(rentaSurface)||0, taux=parseFloat(rentaTaux)||0;
  const mat=parseFloat(rentaMat)||0, dep=parseFloat(rentaDep)||0;
  const heures=surf*2.5;
  const mo=heures*taux;
  const ca_total=mo+mat+dep;
  const charges=mo*0.45;
  const benef=ca_total-mat-dep-charges;
  const marge=ca_total>0?Math.round((benef/ca_total)*100):0;
  setRentaResult({ heures:Math.round(heures), mo:Math.round(mo), ca_total:Math.round(ca_total), charges:Math.round(charges), benef:Math.round(benef), marge, prix_m2:surf>0?Math.round(ca_total/surf):0 });
};
```

**JSX — tab Rentabilité :**
```jsx
{toolTab === "rentabilite" && <div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
    {[["Surface chantier m²",rentaSurface,setRentaSurface],["Taux horaire €/h",rentaTaux,setRentaTaux],["Coût matériaux €",rentaMat,setRentaMat],["Déplacements €",rentaDep,setRentaDep]].map(([label,val,set])=>(
      <div key={label}>
        <div style={{fontSize:9,color:"rgba(240,237,230,0.38)",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
        <input style={s.inp} type="number" value={val} onChange={e=>set(e.target.value)} />
      </div>
    ))}
  </div>
  <button style={s.greenBtn} onClick={calculerRentabilite}>📊 Calculer ma rentabilité</button>
  {rentaResult && <div style={{marginTop:14}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
      {[["CA Total",rentaResult.ca_total+"€","#C9A84C"],["Bénéfice net",rentaResult.benef+"€",rentaResult.benef>0?"#52C37A":"#E05252"],["Marge",rentaResult.marge+"%",rentaResult.marge>25?"#52C37A":rentaResult.marge>10?"#E8873A":"#E05252"],["Prix/m²",rentaResult.prix_m2+"€","#5290E0"]].map(([l,v,c])=>(
        <div key={l} style={{...s.sc,textAlign:"left",padding:"12px 14px"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:c}}>{v}</div>
          <div style={{fontSize:10,color:"rgba(240,237,230,0.5)",marginTop:3}}>{l}</div>
        </div>
      ))}
    </div>
    <div style={s.card}>
      <div style={{fontSize:9,color:"#C9A84C",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>DÉTAIL</div>
      {[["Main d'œuvre ("+rentaResult.heures+"h × "+rentaTaux+"€)",rentaResult.mo+"€","rgba(240,237,230,0.7)"],["Matériaux",rentaMat+"€","rgba(240,237,230,0.5)"],["Déplacements",rentaDep+"€","rgba(240,237,230,0.5)"],["Charges sociales (45%)","-"+rentaResult.charges+"€","#E05252"],["Bénéfice net","→ "+rentaResult.benef+"€",rentaResult.benef>0?"#52C37A":"#E05252"]].map(([l,v,c])=>(
        <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
          <div style={{fontSize:11,color:"rgba(240,237,230,0.55)"}}>{l}</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,color:c}}>{v}</div>
        </div>
      ))}
      <div style={{height:1,background:"rgba(255,255,255,0.06)",margin:"8px 0"}}/>
      <div style={{height:8,borderRadius:4,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
        <div style={{width:Math.max(0,Math.min(rentaResult.marge,100))+"%",height:"100%",borderRadius:4,background:rentaResult.marge>25?"linear-gradient(90deg,#52C37A,#C9A84C)":rentaResult.marge>10?"#E8873A":"#E05252",transition:"width 0.6s ease"}}/>
      </div>
      <div style={{fontSize:10,color:"rgba(240,237,230,0.4)",marginTop:4}}>Marge : {rentaResult.marge}% {rentaResult.marge<15?"⚠️ Attention — marge insuffisante":rentaResult.marge>30?"✅ Excellente marge":""}</div>
    </div>
  </div>}
</div>}
```

- [ ] Ajouter states renta*
- [ ] Ajouter fonction calculerRentabilite
- [ ] Ajouter tab "rentabilite"/"Rentabilité" dans liste tabs Outils
- [ ] Ajouter JSX du tab Rentabilité
- [ ] `npm run build` → OK

---

### Task 6 : Jumeau Numérique — IA Dédiée par Projet

**Fonctionnalité :** Dans la page Projets, bouton "Consulter une IA" ouvre un overlay de chat avec contexte du projet pré-chargé. L'IA "connaît" le projet et répond en contexte.

**Nouveaux states :**
```js
const [projetChat, setProjetChat] = useState(null);
const [projetChatMsgs, setProjetChatMsgs] = useState([]);
const [projetChatInput, setProjetChatInput] = useState("");
const [projetChatLoading, setProjetChatLoading] = useState(false);
```

**Nouvelle fonction sendProjetChat :**
```js
const ouvrirProjetChat = (p) => {
  setProjetChat(p);
  setProjetChatMsgs([{role:"ai", text:"🏗 Je connais votre projet \""+p.nom+"\" ("+p.type+"). "+( p.notes?"Notes : "+p.notes+" — ":""  )+"Posez-moi toutes vos questions sur ce chantier."}]);
  setProjetChatInput("");
};

const sendProjetChat = async () => {
  if (!projetChatInput.trim() || !apiKey || !projetChat) return;
  const txt = projetChatInput.trim();
  setProjetChatInput("");
  const newMsgs = [...projetChatMsgs, {role:"user",text:txt}];
  setProjetChatMsgs([...newMsgs, {role:"ai",text:"..."}]);
  setProjetChatLoading(true);
  try {
    const r = await withRetry(()=>fetch("https://api.anthropic.com/v1/messages",{
      method:"POST", headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:900,
        system:"Tu es l'assistant IA dédié au projet suivant — réponds en contexte de ce projet : Nom : "+projetChat.nom+". Type : "+projetChat.type+". Date : "+projetChat.date+". Statut : "+projetChat.statut+". Notes : "+(projetChat.notes||"aucune")+". Tu es expert bâtiment et tu connais les normes DTU françaises. Réponds de façon concise et pratique.",
        messages: newMsgs.filter(m=>m.text!=="...").map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text})).slice(-8) })}));
    const data = await r.json(); if(data.error) throw new Error(data.error.message);
    setProjetChatMsgs([...newMsgs, {role:"ai",text:data.content[0].text}]);
  } catch(e) { setProjetChatMsgs([...newMsgs, {role:"ai",text:"Erreur : "+e.message}]); }
  finally { setProjetChatLoading(false); }
};
```

**JSX — overlay modal (ajouter avant showPaywall) :**
```jsx
{projetChat && (
  <div style={{position:"fixed",inset:0,background:"rgba(6,8,13,0.98)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",display:"flex",flexDirection:"column",zIndex:9994,maxWidth:430,margin:"0 auto"}}>
    <div style={{padding:"14px 16px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:"0.5px solid rgba(201,168,76,0.15)",flexShrink:0}}>
      <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2.2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700}}>{projetChat.nom}</div>
        <div style={{fontSize:10,color:"#C9A84C"}}>IA dédiée · {projetChat.type}</div>
      </div>
      <button onClick={()=>setProjetChat(null)} style={{background:"none",border:"none",color:"rgba(240,237,230,0.4)",fontSize:22,cursor:"pointer",padding:4}}>×</button>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:10}}>
      {projetChatMsgs.map((m,i)=>(
        <div key={i} style={m.role==="ai"?s.msgA:s.msgU}>
          <div style={s.mav}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round">{m.role==="ai"?<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>:<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}</svg></div>
          <div style={{...m.role==="ai"?s.bubA:s.bubU}} dangerouslySetInnerHTML={{__html:m.text==="..."?"<span>...</span>":m.text.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>")}}/>
        </div>
      ))}
    </div>
    <div style={{padding:"10px 16px 16px",borderTop:"0.5px solid rgba(255,255,255,0.06)",flexShrink:0}}>
      <div style={s.inputBar}>
        <textarea style={s.ci} value={projetChatInput} onChange={e=>setProjetChatInput(e.target.value)} placeholder={"Question sur "+projetChat.nom+"..."} rows={1} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendProjetChat();}}}/>
        <button style={s.sb} onClick={sendProjetChat} disabled={projetChatLoading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  </div>
)}
```

**JSX — modifier le bouton "Consulter une IA" dans projet card :**
```jsx
// Avant :
<button onClick={() => { goPage("coach"); }}>Consulter une IA</button>
// Après :
<button onClick={() => ouvrirProjetChat(p)}>🤖 IA dédiée</button>
```

- [ ] Ajouter states projetChat*
- [ ] Ajouter fonctions ouvrirProjetChat + sendProjetChat
- [ ] Remplacer bouton "Consulter une IA" dans carte projet
- [ ] Ajouter overlay modal avant showPaywall
- [ ] `npm run build` → OK

---

### Task 7 : CR Chantier PDF (Artisan + Particulier)

**Fonctionnalité :** Dans chaque projet, bouton "CR Chantier" → l'IA génère un compte-rendu professionnel → PDF téléchargeable.

**Nouveau state :**
```js
const [crLoading, setCrLoading] = useState(false);
```

**Nouvelle fonction genererCRChantier :**
```js
const genererCRChantier = async (p) => {
  if (!apiKey) return;
  setCrLoading(true);
  try {
    const r = await withRetry(()=>fetch("https://api.anthropic.com/v1/messages",{
      method:"POST", headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1200,
        system:`Tu es expert en compte-rendu de chantier. Génère un CR professionnel. Réponds UNIQUEMENT en JSON valide : {"avancement":"X%","travaux_realises":["travail 1","travail 2"],"travaux_restants":["travail 1"],"observations":["observation 1"],"prochaine_intervention":"description courte","reserves":["réserve importante ou vide si aucune"]}`,
        messages:[{role:"user",content:"Projet : "+p.nom+"\nType : "+p.type+"\nDate : "+p.date+"\nStatut : "+p.statut+"\nNotes : "+(p.notes||"aucune")+"\nGénère le compte-rendu de chantier."}] })}));
    const data = await r.json(); if(data.error) throw new Error(data.error.message);
    genererCRPDF(p, JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim()));
  } catch(e) { alert("Erreur CR : "+e.message); }
  finally { setCrLoading(false); }
};
```

**Nouvelle fonction genererCRPDF :**
```js
const genererCRPDF = (projet, cr) => {
  const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  const W=210, H=297, G=[82,195,122];
  const dateStr = new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
  doc.setFillColor(6,8,13); doc.rect(0,0,W,H,"F");
  doc.setFillColor(...G); doc.rect(0,0,5,H,"F"); doc.rect(0,0,W,1.5,"F");
  doc.setFillColor(10,14,22); doc.rect(5,1.5,W-5,52,"F");
  doc.setFillColor(...G); doc.roundedRect(14,10,22,22,3,3,"F");
  doc.setTextColor(6,8,13); doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text("CR",25,26,{align:"center"});
  doc.setTextColor(240,237,230); doc.setFontSize(15); doc.setFont("helvetica","bold"); doc.text("COMPTE-RENDU DE CHANTIER",42,20);
  doc.setTextColor(...G); doc.setFontSize(8); doc.text(dateStr,42,28);
  doc.setTextColor(100,96,88); doc.setFontSize(8); doc.setFont("helvetica","normal");
  doc.text("Projet : "+projet.nom+"  ·  Type : "+projet.type,42,35);
  const avancement=parseInt(cr.avancement)||0;
  doc.setFillColor(20,24,34); doc.rect(42,40,W-50,7,"F");
  doc.setFillColor(...G); doc.rect(42,40,(W-50)*avancement/100,7,"F");
  doc.setTextColor(240,237,230); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text("Avancement : "+cr.avancement,(W+42)/2,45.5,{align:"center"});
  doc.setDrawColor(...G); doc.setLineWidth(0.3); doc.line(5,54,W,54);
  let y=62;
  const section=(title,items,color)=>{
    if(!items||!items.length)return;
    doc.setFillColor(10,13,20); doc.roundedRect(14,y,W-28,9,2,2,"F");
    doc.setTextColor(...color); doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.text(title,22,y+6); y+=13;
    items.forEach(item=>{
      if(!item)return;
      const lines=doc.splitTextToSize("• "+item,W-40);
      doc.setTextColor(160,155,148); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text(lines,22,y); y+=lines.length*5+2;
    }); y+=3;
  };
  section("TRAVAUX RÉALISÉS",cr.travaux_realises,[82,195,122]);
  section("TRAVAUX RESTANTS",cr.travaux_restants,[201,168,76]);
  section("OBSERVATIONS",cr.observations,[82,144,224]);
  if(cr.reserves&&cr.reserves[0]) section("RÉSERVES",cr.reserves,[224,82,82]);
  if(cr.prochaine_intervention){
    doc.setFillColor(8,10,16); doc.roundedRect(14,y,W-28,20,2,2,"F");
    doc.setDrawColor(...G); doc.setLineWidth(0.2); doc.roundedRect(14,y,W-28,20,2,2,"S");
    doc.setTextColor(...G); doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.text("PROCHAINE INTERVENTION",22,y+7);
    doc.setTextColor(160,155,148); doc.setFontSize(8); doc.setFont("helvetica","normal");
    doc.text(doc.splitTextToSize(cr.prochaine_intervention,W-48),22,y+13); y+=24;
  }
  doc.setDrawColor(40,50,68); doc.setLineWidth(0.3); doc.line(18,270,82,270); doc.line(128,270,192,270);
  doc.setTextColor(100,96,88); doc.setFontSize(7); doc.setFont("helvetica","normal");
  doc.text("Chef de chantier",50,275,{align:"center"}); doc.text("Maître d'ouvrage",160,275,{align:"center"});
  doc.setFillColor(10,14,22); doc.rect(0,278,W,19,"F");
  doc.setFillColor(...G); doc.rect(0,278,5,19,"F"); doc.rect(0,295.5,W,1.5,"F");
  doc.setTextColor(...G); doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.text("MAESTROMIND",13,286);
  doc.setTextColor(80,76,70); doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.text("CR généré par IA",13,292);
  doc.text(dateStr,W-12,286,{align:"right"});
  doc.save("CR-"+projet.nom.replace(/\s+/g,"-")+"-"+new Date().getFullYear()+".pdf");
};
```

**JSX — modifier les boutons d'action dans carte projet :**
```jsx
// Remplacer le bouton "Générer certificat" par deux boutons :
<button onClick={() => ouvrirProjetChat(p)}>🤖 IA dédiée</button>
<button onClick={() => { goPage("cert"); setCertProjet(p.nom); }}>🏅 Certificat</button>
<button onClick={() => genererCRChantier(p)} disabled={crLoading}>
  {crLoading?"...":"📋 CR Chantier"}
</button>
```

Changer la grid de `1fr 1fr` à `1fr 1fr 1fr` pour les 3 boutons.

- [ ] Ajouter state crLoading
- [ ] Ajouter fonctions genererCRChantier + genererCRPDF
- [ ] Mettre à jour les boutons actions dans carte projet (3 boutons en grid 3 colonnes)
- [ ] `npm run build` → OK

---

### Task 8 : Danger Caché — Alerte Renforcée (Scan)

**Fonctionnalité :** Quand le diagnostic renvoie urgence URGENT ou DANGER, afficher une alerte spéciale avec des signaux d'alerte spécifiques (amiante, plomb, gaz, structure) + lien vers professionnel.

**JSX — modifier le bloc `scanResult &&` dans le tab Photo :**
Ajouter AVANT la liste des étapes, quand urgence est URGENT ou DANGER :

```jsx
{(scanResult.urgence==="URGENT"||scanResult.urgence==="DANGER") && (
  <div style={{background:"rgba(224,82,82,0.08)",border:"1px solid rgba(224,82,82,0.35)",borderRadius:10,padding:"11px 12px",marginBottom:12}}>
    <div style={{fontSize:11,fontWeight:700,color:"#E05252",marginBottom:6}}>⚠️ INTERVENTION PROFESSIONNELLE REQUISE</div>
    <div style={{fontSize:10,color:"rgba(224,82,82,0.8)",lineHeight:1.7}}>
      Ne pas tenter de réparation sans évaluation experte.<br/>
      Risques potentiels : amiante, plomb, gaz, instabilité structurelle.<br/>
      Contactez immédiatement un professionnel qualifié.
    </div>
    <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
      {["Amiante → SS3/SS4","Plomb → CREP","Gaz → 0800 47 33 33","Structure → Bureau de contrôle"].map(a=>(
        <span key={a} style={{fontSize:9,padding:"3px 8px",borderRadius:20,background:"rgba(224,82,82,0.12)",border:"0.5px solid rgba(224,82,82,0.35)",color:"#E05252",fontWeight:600}}>{a}</span>
      ))}
    </div>
  </div>
)}
```

Et modifier le badge d'urgence pour colorier différemment selon le niveau :
```jsx
// Remplacer le span urgence statique par :
<span style={{padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:700,
  background: scanResult.urgence==="DANGER"?"rgba(224,82,82,0.18)":scanResult.urgence==="URGENT"?"rgba(232,135,58,0.15)":scanResult.urgence==="MODERE"?"rgba(201,168,76,0.12)":"rgba(82,195,122,0.12)",
  color: scanResult.urgence==="DANGER"?"#E05252":scanResult.urgence==="URGENT"?"#E8873A":scanResult.urgence==="MODERE"?"#C9A84C":"#52C37A",
  border: "0.5px solid currentColor"
}}>{scanResult.urgence}</span>
```

- [ ] Ajouter le bloc alerte danger caché dans scanResult JSX
- [ ] Mettre à jour les couleurs dynamiques du badge urgence
- [ ] `npm run build` → OK

---

### Task 9 : Score Confiance Artisan — Visuel Amélioré

**Fonctionnalité :** Améliorer l'affichage du résultat artisanResult pour inclure un score visuel calculé à partir du nombre de checks validés.

**JSX — modifier le bloc `artisanResult &&` dans tab RGE :**
Ajouter avant la liste des checks :
```jsx
{artisanResult && (() => {
  const score = Math.min(100, Math.round((artisanResult.checks?.length||0) * 12.5));
  const color = score>=75?"#52C37A":score>=50?"#E8873A":"#E05252";
  return (
    <div style={{...s.card,marginBottom:12,textAlign:"center"}}>
      <div style={{position:"relative",width:80,height:80,margin:"0 auto 10px"}}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
          <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${score*2.136} 213.6`} strokeDashoffset="53.4"
            strokeLinecap="round" style={{transition:"stroke-dasharray 0.8s ease"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color}}>{score}%</div>
      </div>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,color}}>
        {score>=75?"Artisan fiable":"score>=50?"Vérifications requises":"⚠️ Risque élevé"}
      </div>
      <div style={{fontSize:10,color:"rgba(240,237,230,0.45)",marginTop:3}}>{artisanResult.checks?.length||0} points vérifiés</div>
    </div>
  );
})()}
```

**Note :** corriger la template literal imbriquée dans le JSX avec un ternaire propre :
```jsx
{score>=75?"✅ Artisan fiable":score>=50?"⚠️ Vérifications requises":"🚫 Risque élevé"}
```

- [ ] Modifier le bloc artisanResult dans tab RGE pour ajouter le score visuel circulaire
- [ ] `npm run build` → OK

---

## Récapitulatif — Ordre d'exécution recommandé

1. Task 1 — Vocal (impact UX immédiat)
2. Task 2 — Contre-devis (viralité particuliers)
3. Task 3 — Planning chantier (rétention)
4. Task 4 — Devis Pro PDF (monétisation artisans)
5. Task 5 — Rentabilité (artisans)
6. Task 6 — Jumeau numérique (engagement long terme)
7. Task 7 — CR Chantier PDF (artisans)
8. Task 8 — Danger caché (sécurité + confiance)
9. Task 9 — Score artisan (UX amélioration)

**Après chaque task : `npm run build` et test manuel dans le navigateur.**
