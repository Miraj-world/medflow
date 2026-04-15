// assistant.ts

// Generates a reply for the MedFlow assistant based on user input
export function getAssistantReply(message: string, isLoggedIn: boolean): string {
  const text = message.toLowerCase().trim();

  // Normalize text by removing spaces, hyphens, and underscores
  const normalized = text.replace(/[\s\-_]/g, "");

  // Helper function to check if any keyword is included
  const hasAny = (keywords: string[]): boolean =>
    keywords.some((keyword) => normalized.includes(keyword));

  // =========================================================
  // LOGIN REQUIRED CHECK
  // =========================================================
  if (!isLoggedIn) {
    const loginRequiredKeywords = [
      "dashboard",
      "patientlist",
      "searchpatient",
      "findpatient",
      "analytics",
      "chart",
      "charts",
      "graph",
      "appointment",
      "appointments",
      "schedule",
      "record",
      "records",
      "alert",
      "alerts",
      "notification",
      "notifications"
    ];

    if (hasAny(loginRequiredKeywords)) {
      return "That feature is available after logging in. Please sign in to continue.";
    }
  }

  // =========================================================
  // MENTAL HEALTH / CRISIS SUPPORT
  // =========================================================
  if (
    hasAny([
      "suicidal",
      "killmyself",
      "wanttodie",
      "endmylife",
      "dontwanttolive"
    ])
  ) {
    return "I'm really sorry you're feeling this way. You do not have to go through it alone. You can call or text 988, the Suicide & Crisis Lifeline in the United States, to speak with someone right away. If you are in immediate danger, please call emergency services now.";
  }

  // =========================================================
  // EMERGENCY COMBINATIONS
  // =========================================================

  // Chest pain + trouble breathing
  if (
    hasAny(["chestpain"]) &&
    hasAny(["cantbreathe", "cannotbreathe", "troublebreathing", "shortnessofbreath"])
  ) {
    return "Chest pain together with trouble breathing may be serious. Please seek emergency medical care right away.";
  }

  // Rash + trouble breathing
  if (
    hasAny(["rash", "skinrash"]) &&
    hasAny(["cantbreathe", "cannotbreathe", "troublebreathing", "shortnessofbreath"])
  ) {
    return "A rash together with trouble breathing may be a serious allergic reaction. Please seek emergency medical care right away.";
  }

  // Severe bleeding + dizziness/fainting
  if (
    hasAny(["severebleeding", "bleedingbadly"]) &&
    hasAny(["dizzy", "dizziness", "lightheaded", "passingout", "fainted"])
  ) {
    return "Heavy bleeding together with dizziness or fainting may be an emergency. Please seek urgent medical care immediately.";
  }

  // =========================================================
  // URGENT SINGLE EMERGENCY SIGNS
  // =========================================================
  if (
    hasAny([
      "heartattack",
      "cantbreathe",
      "cannotbreathe",
      "troublebreathing",
      "shortnessofbreath",
      "severebleeding",
      "bleedingbadly",
      "passingout",
      "fainted",
      "stroke",
      "seizure"
    ])
  ) {
    return "This may be serious and could need urgent medical attention. Please seek emergency care right away or call emergency services.";
  }

  // =========================================================
  // COMBINED SYMPTOMS (HIGHER PRIORITY)
  // =========================================================

  // Dizziness + nausea/vomiting
  if (
    hasAny(["dizzy", "dizziness", "lightheaded", "vertigo"]) &&
    hasAny(["vomit", "vomiting", "throwup", "nausea"])
  ) {
    return "Dizziness together with nausea or vomiting can have several possible causes, including dehydration, infection, inner ear issues, medication effects, or other medical problems. I cannot tell the exact cause from chat alone. If this is severe, keeps happening, makes it hard to stand, or comes with fainting, confusion, chest pain, trouble breathing, dehydration, or strong pain, you should seek urgent medical care. Otherwise, it would be a good idea to contact a doctor soon.";
  }

  // Fever + cough
  if (hasAny(["fever"]) && hasAny(["cough"])) {
    return "A fever together with a cough can happen with infections such as a cold, flu, or other illnesses. I cannot tell the exact cause from chat alone. If symptoms are getting worse, not improving, or come with trouble breathing, chest pain, dehydration, or unusual weakness, you should contact a doctor.";
  }

  // Stomach pain + nausea/vomiting
  if (
    hasAny([
      "stomachpain",
      "abdominalpain",
      "bellypain",
      "intestine",
      "intestinal",
      "lowerabdomen",
      "lowerstomach",
      "lowerintestine",
      "stomachhurts",
      "abdomenhurts"
    ]) &&
    hasAny(["vomit", "vomiting", "throwup", "nausea"])
  ) {
    return "Stomach or abdominal pain together with nausea or vomiting can have many causes, including food-related illness, infection, irritation, or inflammation. I cannot tell the exact cause from chat alone. If it is severe, keeps happening, or comes with fever, dehydration, blood, or worsening pain, you should seek medical care.";
  }

  // Diarrhea + vomiting
  if (
    hasAny(["diarrhea", "diarrhoea"]) &&
    hasAny(["vomit", "vomiting", "throwup", "nausea"])
  ) {
    return "Vomiting together with diarrhea can happen with stomach bugs, food-related illness, intolerance, or other digestive problems. A short mild case is not always serious, but this combination can lead to dehydration. If it is severe, does not improve, or comes with fever, strong pain, blood, or signs of dehydration, you should contact a doctor.";
  }

  // Dizziness + diarrhea
  if (
    hasAny(["dizzy", "dizziness", "lightheaded", "vertigo"]) &&
    hasAny(["diarrhea", "diarrhoea"])
  ) {
    return "Dizziness together with diarrhea can happen for several reasons, including dehydration, infection, food-related illness, or other digestive issues. I cannot tell the exact cause from chat alone. If it is strong, keeps happening, or comes with fainting, weakness, fever, or trouble staying hydrated, you should seek medical advice.";
  }

  // Back pain + numbness/weakness
  if (
    hasAny(["backpain", "backhurts"]) &&
    hasAny(["numb", "numbness", "weakness"])
  ) {
    return "Back pain together with numbness or weakness can sometimes point to a more serious problem. I cannot tell the exact cause from chat alone, but you should seek medical advice promptly, especially if it is worsening or affecting movement.";
  }

  // Diarrhea + blood
  if (
    hasAny(["diarrhea", "diarrhoea"]) &&
    hasAny(["blood", "bloody"])
  ) {
    return "Diarrhea with blood can be more concerning than a mild stomach illness. Please contact a doctor promptly, especially if it is severe, ongoing, or comes with dizziness, fever, or strong pain.";
  }

  // Fever + headache
  if (
    hasAny(["fever"]) &&
    hasAny(["headache"])
  ) {
    return "A fever together with a headache can happen with infections and other illnesses. Some causes are mild, but if it is severe, worsening, or comes with confusion, vomiting, stiff neck, or unusual weakness, you should seek medical attention.";
  }

  // =========================================================
  // LOGIN / ACCOUNT HELP
  // =========================================================
  if (hasAny(["login", "signin"])) {
    return "Enter your email and password on the login page, then select Open dashboard.";
  }

  if (hasAny(["logout", "signout"])) {
    return "Use the logout option in the application to safely sign out of your MedFlow account.";
  }

  if (hasAny(["createaccount", "register", "signup"])) {
    return "Select Create new account on the login page and fill out the required information to make a new account.";
  }

  if (hasAny(["forgotpassword", "resetpassword"])) {
    return "Use the password reset option on the login page if it is available, or contact an administrator for assistance.";
  }

  // =========================================================
  // DASHBOARD / NAVIGATION
  // =========================================================
  if (hasAny(["dashboard", "homepage", "mainpage"])) {
    return "The dashboard shows key MedFlow information such as patient counts, doctor workload, missed appointments, alerts, and system metrics.";
  }

  if (hasAny(["patientlist", "searchpatient", "findpatient"])) {
    return "Use the Patient List page to search for patients and review their assigned doctor, conditions, missed visits, and alerts.";
  }

  if (hasAny(["analytics", "charts", "graph"])) {
    return "The Analytics page shows trends such as condition distribution, appointment reliability, and overall system performance.";
  }

  if (hasAny(["alert", "alerts", "notification", "notifications"])) {
    return "Alerts highlight important issues such as missed appointments or higher-risk patients so staff can respond more quickly.";
  }

  // =========================================================
  // APPOINTMENTS / SCHEDULING
  // =========================================================
  if (hasAny(["appointment", "appointments", "schedule", "book"])) {
    return "Scheduling features depend on your MedFlow setup, but the system is designed to help manage appointments, availability, and patient scheduling.";
  }

  // =========================================================
  // MEDICATION QUESTIONS
  // =========================================================
  if (hasAny(["medication", "medicine", "prescription", "pill", "drug"])) {
    return "I can provide only general information about medications. For advice about what to take, dosage, side effects, interactions, or whether something is safe for you personally, it is best to speak with a doctor or pharmacist.";
  }

  // =========================================================
  // SPECIFIC CONDITIONS
  // =========================================================
  if (hasAny(["diabetes"])) {
    return "Diabetes is a condition that affects how the body manages blood sugar. Questions about symptoms, testing, treatment, or long-term care are best discussed with a doctor.";
  }

  if (hasAny(["hypertension", "highbloodpressure"])) {
    return "High blood pressure can increase health risks over time, but it often does not cause obvious symptoms. A doctor can help with testing, diagnosis, and treatment options.";
  }

  if (hasAny(["asthma"])) {
    return "Asthma affects the airways and can make breathing more difficult at times. Symptoms and severity can vary, so a doctor can help determine the best treatment plan.";
  }

  if (hasAny(["copd"])) {
    return "COPD is a chronic lung condition that can affect breathing. The seriousness can vary from person to person, so it is important to speak with a doctor about symptoms and management.";
  }

  // =========================================================
  // SINGLE SYMPTOMS
  // =========================================================

  if (
    hasAny([
      "stomachpain",
      "abdominalpain",
      "bellypain",
      "intestine",
      "intestinal",
      "lowerabdomen",
      "lowerstomach",
      "lowerintestine",
      "stomachhurts",
      "abdomenhurts"
    ])
  ) {
    return "Pain in the stomach, abdomen, or intestinal area can have many possible causes, including something mild like digestive irritation or something more serious like infection or inflammation. I cannot tell the exact cause from chat alone. If the pain is severe, getting worse, or comes with fever, vomiting, blood, or trouble using the bathroom, you should seek medical care soon.";
  }

  if (hasAny(["headache"])) {
    return "Headaches can happen for many reasons, including stress, dehydration, lack of sleep, illness, or other causes. A mild headache is not always serious, but if it is severe, sudden, unusual, or keeps coming back, it would be best to contact a doctor.";
  }

  if (hasAny(["fever"])) {
    return "A fever can happen for many reasons, most commonly infection. Some fevers are mild and short-lasting, but if the fever is high, lasts a long time, or comes with worsening symptoms, you should contact a doctor.";
  }

  if (hasAny(["cough"])) {
    return "A cough can be caused by many things, including a cold, allergies, irritation, or infection. If it is mild and improving, it may pass on its own, but if it lasts, worsens, or comes with trouble breathing, chest pain, or fever, you should seek medical advice.";
  }

  if (hasAny(["nausea", "vomit", "vomiting", "throwup"])) {
    return "Nausea and vomiting can happen for many reasons, including infection, food-related illness, medication effects, or digestive issues. A short mild episode is not always serious, but if it is severe, does not stop, or causes dehydration, you should contact a doctor.";
  }

  if (hasAny(["diarrhea", "diarrhoea"])) {
    return "Diarrhea can happen for many reasons, including something you ate, food intolerance, infection, stress, or other digestive issues. A short-lasting mild case is not always serious, but if it is severe, lasts more than a couple of days, or comes with dehydration, fever, strong pain, or blood, you should contact a doctor.";
  }

  if (hasAny(["constipation", "constipated"])) {
    return "Constipation can happen for many reasons, including diet changes, dehydration, stress, medication effects, or other digestive issues. It is not always serious, but if it becomes severe, lasts a long time, or comes with strong pain, vomiting, or bleeding, you should contact a doctor.";
  }

  if (hasAny(["sorethroat", "throatpain"])) {
    return "A sore throat can be caused by irritation, allergies, a cold, or infection. Mild cases often improve, but if it becomes severe, lasts several days, or makes it hard to swallow or breathe, you should seek medical advice.";
  }

  if (hasAny(["runnynose", "stuffynose", "congestion", "congested"])) {
    return "Congestion or a runny nose can happen with colds, allergies, or other minor illnesses. It is often not serious, but if symptoms last a long time, worsen, or come with breathing trouble, high fever, or significant pain, you should contact a doctor.";
  }

  if (hasAny(["dizzy", "dizziness", "lightheaded", "vertigo"])) {
    return "Dizziness can have many causes, including dehydration, illness, low blood sugar, medication effects, or inner ear issues. If it is mild it may pass, but if it continues, worsens, causes fainting, or makes it hard to function, you should contact a doctor.";
  }

  if (hasAny(["tired", "fatigue", "exhausted"])) {
    return "Feeling tired or fatigued can happen for many reasons, including poor sleep, stress, illness, or other health conditions. If it is strong, lasts a long time, or comes with other concerning symptoms, it would be a good idea to speak with a doctor.";
  }

  if (hasAny(["rash", "skinrash"])) {
    return "A rash can happen for many reasons, including irritation, allergy, infection, or skin conditions. Some rashes are mild, but if it spreads quickly, is painful, or comes with swelling, fever, or trouble breathing, seek medical care right away.";
  }

  if (hasAny(["backpain", "backhurts"])) {
    return "Back pain can have many causes, including strain, posture issues, or other conditions. Mild cases may improve, but if the pain is severe, keeps getting worse, or comes with weakness, numbness, or loss of bladder or bowel control, you should seek medical care promptly.";
  }

  // =========================================================
  // GENERAL HEALTH FALLBACK
  // =========================================================
  if (hasAny(["pain", "hurt", "sick", "symptom"])) {
    return "That symptom can have many possible causes, and I cannot determine the exact reason from chat alone. If it is mild and improving, it may not be serious, but if it becomes severe, lasts, or comes with other concerning symptoms, you should contact a doctor.";
  }

  // =========================================================
  // GREETINGS / CASUAL
  // =========================================================
  if (normalized === "hi" || normalized === "hello" || normalized === "hey") {
    return "Hello. I’m the MedFlow assistant. I can help with system navigation, general questions, and basic health information.";
  }

  if (hasAny(["thanks", "thankyou"])) {
    return "You're welcome. Let me know if you need anything else.";
  }

  // =========================================================
  // DEFAULT FALLBACK
  // =========================================================
  return "I can help with MedFlow features like login, dashboard, patients, analytics, and scheduling, as well as general health-related questions.";
}