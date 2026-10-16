
/* v1.27.4: završni prikaz nakon učitavanja svih nadogradnji.
   Prvi render u osnovnom skriptu izvršava se prije v1.20 kalendara. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => render(), {once:true});
} else {
  render();
}
