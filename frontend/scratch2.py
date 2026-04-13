import sys

filepath = r'c:\Users\SURI - BEM 085\Documents\WELDER\DEV\ccmergulho\mergulho-connect\frontend\src\pages\Reports.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    '<StatBox label="Total de Presentes" value={r.total_attendees} accent />',
    '<StatBox label="Total de Presentes" value={r.total_attendees} accent icon={<Users className="h-3.5 w-3.5"/>} />'
)
code = code.replace(
    '<StatBox label="Crianças (Kids)" value={r.children_count} />',
    '<StatBox label="Infantil/Kids" value={r.children_count} icon={<Baby className="h-3.5 w-3.5"/>} />'
)
code = code.replace(
    '<StatBox label="Jovens" value={r.youth_count} />',
    '<StatBox label="Jovens" value={r.youth_count} icon={<Users className="h-3.5 w-3.5"/>} />'
)
code = code.replace(
    '<StatBox label="Monitores" value={r.monitors_count} />',
    '<StatBox label="Monitores" value={r.monitors_count} icon={<ShieldCheck className="h-3.5 w-3.5"/>} />'
)
code = code.replace(
    '<StatBox label="Público Geral" value={Math.max(0, r.total_attendees - (r.children_count || 0) - (r.monitors_count || 0))} />',
    '<StatBox label="Público Geral" value={Math.max(0, r.total_attendees - (r.children_count || 0) - (r.monitors_count || 0))} icon={<Users className="h-3.5 w-3.5"/>} />'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")
