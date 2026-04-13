import sys

filepath = r'c:\Users\SURI - BEM 085\Documents\WELDER\DEV\ccmergulho\mergulho-connect\frontend\src\pages\HomePage.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

target = r'''          }).map(({ icon: Icon, label, path, color }) => (
            <Link key={path} to={path}>
              <Card className="border-0 shadow-xl hover:translate-y-[-4px] transition-all group cursor-pointer overflow-hidden text-center p-6 bg-card/40 backdrop-blur-sm h-full">
                <div className={cn("inline-flex p-3 rounded-2xl text-white shadow-lg mb-3 transition-transform group-hover:scale-110", color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-bold block">{label}</span>
              </Card>
            </Link>
          ))}'''

replacement = r'''          }).map(({ icon: Icon, label, path, color }) => (
            <Link key={path} to={path} className="block h-full">
              <Card className="border-0 shadow-lg overflow-hidden hover:translate-y-[-4px] transition-all duration-300 group relative bg-card/60 backdrop-blur-sm h-full cursor-pointer min-h-[140px]">
                <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full ${color}`} />
                <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
                <CardContent className="p-4 sm:p-5 flex flex-col items-center justify-center relative z-10 h-full">
                  <div className={`p-3.5 sm:p-4 rounded-2xl text-white ${color} shadow-lg mb-3 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-foreground block text-center leading-tight mt-1">{label}</span>
                </CardContent>
                <div className="absolute -bottom-4 -right-4 opacity-[0.03] text-foreground transform scale-[5] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
                  <Icon className="h-full w-full" />
                </div>
              </Card>
            </Link>
          ))}'''

code = code.replace(target, replacement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")
