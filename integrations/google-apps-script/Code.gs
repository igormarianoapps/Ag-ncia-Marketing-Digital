function doPost(event) {
  const secret = PropertiesService.getScriptProperties().getProperty('CONTACT_WEBHOOK_TOKEN');
  const raw = event && event.postData && event.postData.contents;
  if (!secret || !raw || raw.length > 16000) return webhookReply_(false);

  try {
    const request = JSON.parse(raw);
    if (!sameToken_(secret, request.token)) return webhookReply_(false);
    const lead = request.lead;
    if (!lead || !['name', 'company', 'email', 'phone', 'message'].every(
      key => typeof lead[key] === 'string' && lead[key].trim()
    )) return webhookReply_(false);

    const company = lead.company.replace(/[\r\n]+/g, ' ').trim().slice(0, 160);
    const body = [
      'Olá, equipe Traço Nítido!',
      '',
      lead.name + ', da empresa ' + company + ', enviou uma mensagem pelo site.',
      '',
      'O que a empresa precisa',
      lead.message,
      '',
      'Dados para retorno',
      'E-mail: ' + lead.email,
      'WhatsApp: ' + lead.phone
    ].join('\n');
    MailApp.sendEmail({
      to: 'agenciatraconitido@gmail.com',
      subject: 'Novo contato pelo site da Traço Nítido | ' + company,
      body: body,
      replyTo: lead.email,
      name: 'Traço Nítido · Site'
    });
    return webhookReply_(true);
  } catch {
    return webhookReply_(false);
  }
}

function sameToken_(expected, supplied) {
  if (typeof supplied !== 'string' || supplied.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i++) {
    difference |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  }
  return difference === 0;
}

function webhookReply_(sent) {
  return ContentService.createTextOutput(JSON.stringify({ sent: sent }))
    .setMimeType(ContentService.MimeType.JSON);
}
