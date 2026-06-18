async function main() {
  const url = 'https://www.facebook.com/GobiernoHueypoxtla';
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

  console.log(`Intentando conectar a ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'upgrade-insecure-requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'sec-fetch-site': 'none',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'sec-fetch-dest': 'document',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    console.log(`Código de estado: ${res.status}`);
    const html = await res.text();
    console.log(`Tamaño del HTML obtenido: ${html.length} bytes`);
    console.log('--- HTML Completo ---');
    console.log(html);
    console.log('---------------------');
  } catch (err) {
    console.error('Error de red:', err.message);
  }
}
main();
