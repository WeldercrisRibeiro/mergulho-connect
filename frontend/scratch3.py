import sys

filepath = r'c:\Users\SURI - BEM 085\Documents\WELDER\DEV\ccmergulho\mergulho-connect\frontend\src\pages\Tesouraria.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

import_target = "import { getErrorMessage } from \"@/lib/errorMessages\";"
code = code.replace(
    import_target,
    import_target + "\nimport { DashboardStatBox } from \"@/components/DashboardStatBox\";"
)

target_macro = r'''      {/* Summary Macro */}
      <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Visão Consolidada
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <DollarSign className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-xl font-bold text-emerald-600">R$ {totalAmount.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Total Arrecadado</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <Heart className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">R$ {totalTithes.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Dízimos</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <Wallet className="h-5 w-5 mx-auto text-indigo-500 mb-1" />
            <p className="text-xl font-bold">R$ {totalOfferings.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Ofertas</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center shadow-sm">
            <Users className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-xl font-bold">{uniqueTithers}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Dizimistas</p>
          </div>
        </div>
      </div>'''

replacement_macro = '''      {/* Summary Macro */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Visão Consolidada
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardStatBox 
            icon={<DollarSign className="h-6 w-6"/>} 
            label="Total Arrecadado" 
            value={`R$ ${totalAmount.toFixed(2)}`} 
            color="bg-emerald-500" 
          />
          <DashboardStatBox 
            icon={<Heart className="h-6 w-6"/>} 
            label="Dízimos" 
            value={`R$ ${totalTithes.toFixed(2)}`} 
            color="bg-primary" 
          />
          <DashboardStatBox 
            icon={<Wallet className="h-6 w-6"/>} 
            label="Ofertas" 
            value={`R$ ${totalOfferings.toFixed(2)}`} 
            color="bg-indigo-500" 
          />
          <DashboardStatBox 
            icon={<Users className="h-6 w-6"/>} 
            label="Dizimistas" 
            value={uniqueTithers} 
            color="bg-amber-500" 
          />
        </div>
      </div>'''

code = code.replace(target_macro, replacement_macro)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")
