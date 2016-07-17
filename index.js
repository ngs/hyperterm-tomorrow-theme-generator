const fs =  require('fs-extra')
  , path = require('path')
  , Color = require('color')
  , ejs = require('ejs')
  , encoding = 'utf-8'
  , indexJSTemplate = ejs.compile(fs.readFileSync(path.join(__dirname, 'templates', 'index.js.ejs'), { encoding }))
  , readMeTemplate = ejs.compile(fs.readFileSync(path.join(__dirname, 'templates', 'Readme.md.ejs'), { encoding }))
  , basePackageName = fs.readJsonSync(path.join(__dirname, 'package.json')).name
  , colorKeys = [
      'background',
      'red',
      'green',
      'yellow',
      'blue',
      'pink',
      'cyan',
      'light gray',
      'medium gray',
      'red',
      'green',
      'yellow',
      'blue',
      'pink',
      'cyan',
      'white',
      'foreground'
    ]
  ;

function buildPackageJSON(vars, json) {
  json = json || fs.readJsonSync(path.join(__dirname, 'package.json'))
  delete json.scripts;
  delete json.private;
  delete json.dependencies;
  for(var k in json) {
    var v = json[k];
    switch (typeof v) {
    case 'object':
      json[k] = buildPackageJSON(vars, v);
      break;
    case 'string':
      json[k] = v.replace(basePackageName, vars.theme.packageName);
      break;
    default:
      json[k] = v;
      break;
    }
  }
  return json;
}

fs.readdir(path.join(__dirname, './themes/'), (err, files) => {
  files
  .filter((f) => /\.txt$/.test(f))
  .forEach((f) => {
    fs.readFile(path.join(__dirname, './themes/', f), { encoding }, (err, data) => {
      const theme = { name: f.replace(/\.txt$/, '') };
      data.split(/\n/g).forEach((l) => {
        const m = l.match(/#([0-9a-f]{6})\s+([^\n]+)/);
        if(!m) { return }
        theme[m[2].toLowerCase()] = m[1];
      });
      theme.cyan = theme.aqua;
      theme.white = 'ffffff';
      theme.pink = Color(`#${theme.blue}`)
        .mix(Color(`#${theme.red}`), 0.3)
        .hexString()
        .replace(/^#/, '').toLowerCase();
      theme['light gray'] = theme['current line'];
      theme['medium gray'] = theme['comment'];
      theme.packageName = 'hyperterm-' + theme.name.replace(/\s/g, '-').toLowerCase();
      const colors = colorKeys.map((k) => `#${theme[k]}`)
        , templateVars = { colors, theme }
        , indexJS = indexJSTemplate(templateVars)
        , readMe = readMeTemplate(templateVars)
        , packageJSON = buildPackageJSON(templateVars)
        , packageDir = path.join(__dirname, 'dist', theme.packageName)
        ;
      packageJSON.description = `Hyperterm theme based on ${theme.name}`
      fs.ensureDirSync(packageDir);
      fs.copySync(path.join(__dirname, 'screenshots', `${theme.name}.png`), path.join(packageDir, 'screenshot.png'));
      fs.writeFileSync(path.join(packageDir, 'index.js'), indexJS, { encoding });
      fs.writeFileSync(path.join(packageDir, 'Readme.md'), readMe, { encoding });
      fs.writeJsonSync(path.join(packageDir, 'package.json'), packageJSON, { encoding });
    })
  });
})
