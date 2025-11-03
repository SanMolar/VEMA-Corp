let deferredPrompt = null;
const installBtn = document.getElementById('btn-install');

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] beforeinstallprompt disparado');
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'inline-flex';
});

// Por si ya está instalada, ocultar botón
window.addEventListener('appinstalled', () => {
  console.log('[PWA] app instalada');
  installBtn?.remove();
});

// Si ya está en modo standalone, oculta el botón
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
if (isStandalone()) {
  console.log('[PWA] ya en standalone; ocultando botón');
  installBtn?.remove();
}

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) {
    console.warn('[PWA] No hay deferredPrompt. Revisa criterios o usa el icono de instalar del navegador.');
    alert('Si no aparece el diálogo, prueba el icono “Instalar” en la barra de direcciones del navegador.');
    return;
  }
  installBtn.disabled = true;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice; // 'accepted' | 'dismissed'
  console.log('[PWA] userChoice:', outcome);
  deferredPrompt = null;
  installBtn.style.display = 'none';
});
