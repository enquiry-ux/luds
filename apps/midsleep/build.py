#!/usr/bin/env python3
"""Regenerate every distributable copy of Midsleep from index.html.

index.html is the only source. This wraps it in the two heads it needs, stamps
the service worker's cache name with a hash of the shell, and zips the bundle
twice: once with the files at the archive root (drag-and-drop hosts publish the
root) and once inside a midsleep/ folder (nicer to keep on disk).

The cache stamp matters: the worker serves same-origin requests cache-first, so
a deploy that kept the old cache name would keep serving the old app forever.
"""
import hashlib, io, os, re, shutil, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
read = lambda p: io.open(os.path.join(HERE, p), encoding="utf-8").read()
write = lambda p, t: io.open(os.path.join(HERE, p), "w", encoding="utf-8").write(t)

src = read("index.html")

dist = read("dist/index.html")
head = dist.split("<body>\n", 1)[0] + "<body>\n"
tail = dist[dist.rindex('\n<script>\nif ("serviceWorker" in navigator)'):]
write("dist/index.html", head + src + tail)

offline = read("midsleep-offline.html")
write("midsleep-offline.html", offline.split("<body>\n", 1)[0] + "<body>\n" + src + "\n</body>\n</html>\n")

stamp = hashlib.sha1((head + src + tail).encode("utf-8")).hexdigest()[:8]
sw = re.sub(r'var CACHE = "midsleep-[^"]+";', 'var CACHE = "midsleep-%s";' % stamp, read("dist/sw.js"), count=1)
write("dist/sw.js", sw)

for name, inner in (("midsleep-site.zip", False), ("midsleep-pwa.zip", True)):
    path = os.path.join(HERE, name)
    if os.path.exists(path):
        os.remove(path)
    with tempfile.TemporaryDirectory() as tmp:
        root = os.path.join(tmp, "midsleep") if inner else tmp
        shutil.copytree(os.path.join(HERE, "dist"), root) if inner else [
            shutil.copy(os.path.join(HERE, "dist", f), tmp) for f in os.listdir(os.path.join(HERE, "dist"))]
        subprocess.run(["zip", "-rq", path, "midsleep" if inner else "."], cwd=tmp, check=True)

print("shell %s  cache midsleep-%s" % (len(src) // 1024, stamp))
