spinner.gif
progress.gif
processing.gif
placeholder.gif
thumbnail.gif
splash.gif
background.gif
cover.gif
hero.gif
intro.gif
transition.gif
indicator.gif
loader.gif
preloader.gif
refresh.gif
sync.gif
update.gif
notice.gif
message.gif
alert.gif
icon.gif
graphic.gif
image.gif
asset.gif
media.gif
content.gif
display.gif
view.gif
screen.gif
demo.gif
sample.gif
example.gif
guide.gif
help.gif
info.gif
details.gif
overview.gif
summary.gif
result.gif
output.gif





files=(file1 file2 file3)

function itest(){
  for file in "${files[@]}"; do
    

    print "==================== START ===================="

    print "\n--------------- CONTENTS OF $filepath ---------------"
    cat -- "$filepath"

    print "\n--------------- EXECUTING $filepath ---------------"
    filepath=${file:A}  # absolute, normalized path in zsh
    "$filepath"

    print "\n===================== END ====================="
  done
}


files=(bt.js et-bun.js et-node.js)