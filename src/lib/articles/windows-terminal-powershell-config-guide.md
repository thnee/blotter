---
slug: "windows-terminal-powershell-config-guide"
title: "Windows Terminal and PowerShell Configuration Guide"
date: "2025-04-10"
description: >
  Practical guide to configuring colors, encoding, behavior, and features in
  Windows Terminal and PowerShell.
tags:
  - "Developer Experience"
  - "Windows"
---

<script>
  import Note from "$lib/Note.svelte";
  import Image from "$lib/Image.svelte";
</script>

## Background

For the longest time,
Windows had the old program known as just "Command Prompt" or "cmd.exe".
A simple window with black background and white text,
and very limited in features and ergonomics.
Eventually they developed PowerShell,
it was a big upgrade in terms of scripting capabilities,
but only a minor improvement to the terminal and user experience.

There was never a clear distinction between shell and terminal,
as there is on Unix-like systems.
And there were still major limitations in ergonomics,
compared to state of the art on Unix-like systems.
There have been some interesting third party programs that have tried to fill the gap.
But ultimately,
the overall story around terminals and shells has always been quite bad on Windows.

In Windows 10 and 11 there has finally been some major improvements.
There is the new program Windows Terminal,
which is modern, feature rich, fast, and configurable.
PowerShell is being being updated a lot,
and there is [WSL][microsoft-wsl-about] which is a great way to run Linux on Windows.

<Note level="info">

Check out this [article series about Windows Command-Line history][windows-command-line-history]
for some very interesting and nerdy facts and pictures.

</Note>


---


## Windows Terminal

Windows Terminal is really good. It has a lot of good features, and good performance.
It is a massive step up from previous terminal programs.
Using this is a no-brainer,
anyone doing anything on the command line on Windows should be using this program.

It is installed by default on Windows 11,
and on Windows 10 it can be
[downloaded from the Microsoft Store][microsoft-store-windows-terminal].

#### Alternatives

Windows Terminal is really good, but it is not perfect.
My biggest gripe is that it does not support vertical tabs.

There are other alternatives, that offer some interesting competition.
However, they all come with other trade-offs,
and Windows Terminal is still the winner for me personally.
For example, Tabby has vertical tabs, which is nice,
but it has worse performance and compatibility than Windows Terminal,
which is less nice.

Anyway, here is a list of alternative terminal programs, in no particular order:  
[Tabby][tabby],
[Wave Term][waveterm],
[Ghostty][ghostty],
[Contour Terminal][contour-terminal],
[Fluent Terminal][fluent-terminal],
[Hyper][hyper],
[WezTerm][wezterm],
[Alacritty][alacritty],
[Cmder][cmder],
[ConEmu][conemu].


---


## Windows Terminal configuration

Some settings are applied on the program level,
and some settings are applied on the profile level.
The profile level settings can be applied either as profile defaults,
or they can be applied to individual profiles.

There are two settings files, the default settings file and the settings file.
These files are merged together,
so for example, if the settings file defines color schemes in `schemes`,
then it gets added to the list of color schemes
defined in `schemes` in the default settings file.

There is a settings GUI inside the app, which controls the settings file.
However, this GUI does not contain all possible settings.
Some settings can only be changed by editing the settings JSON file manually.

To open the settings GUI, press the `Ctrl+,` keyboard shortcut,
or click the down-arrow in the window top bar and click on Settings.
To open the settings JSON file, press the `Ctrl+Shift+,` keyboard shortcut,
it should open some text editor, probably VS Code, showing a JSON file.

It is also possible to access these interfaces via the Command Palette.
Press `Ctrl+Shift+p` to open the Command Palette, and search for "settings".
This also shows which keyboard shortcut can be used to access various interfaces.

See the [Windows Terminal documentation][terminal-overview] for more info.

#### Install and use another font

There are plenty of good fonts to choose from.
My current favorite is [Hack][font-hack].

If you want to use some kind of powerline prompt,
such as [Starship][Starship] or [Oh My Posh][oh-my-posh],
then you need a modified version of the font that includes Powerline characters.
The standard place to get those fonts from is [Nerd Fonts][nerdfonts].
But even if you don't want to use any powerline prompt,
it doesn't hurt to get the font from Nerd Fonts anyway.

Once the font file (which usually has extension `.ttf`) is downloaded,
navigate to the file in File Explorer, and right click it and select Install.
It will then installed system wide, and will be available in all programs.

The font is configued in Windows Terminal at the profile level, under Appearance.
It can be done either via the settings GUI or via the settings JSON file.

#### Default color schemes

The built in color scheme are ok, but not great.

<Note level="warning">

The default scheme for WSL has a purple background,
which has poor contrast against blue text.
This is an odd decision,
since blue text can occur quite frequently in Linux shell output.
So I definitely recommend changing the color scheme for WSL
to something with a more normal background color.

</Note>

To test the terminal colors on WSL, use the [colortest program][colortest-linux],
and to test it in Powershell, use [a script like this one][colortest-windows]

Setting the preferred color scheme is done at the profile level,
either via the settings GUI or the settings JSON file.

#### Adding new color schemes

Color schemes can be found in many places.
One good collection is the [base16 schemes][base16-windows-terminal].
My personal favorite is the one called Eighties.

Adding new color schemes is done under `schemes`
at the top level in the settings JSON file.
This item should be a list of objects, where each object is a color scheme.

#### Adding new application themes

Application theme can be changed at Appearance -> Application Theme
at the program level in the settings GUI,
or with the `theme` setting in the settings JSON file.

It is possible to [define custom application themes][terminal-themes],
under `themes` at the top level in the settings file.
This should be a list of objects, where each object is a theme.

#### Hide the tab close button

This can only be done via the settings JSON file, not via the settings GUI.

In the application theme,
`showCloseButton` can be set to `never` or `hover` or `activeOnly`,
to hide the button to varying degrees.

#### Changing tab colors

By default, the contrast between the focused and unfocused tabs is quite low,
especially when using a dark color scheme.
This can be improved in two different ways, depending on personal preference.

This can only be done via the settings JSON file, not via the settings GUI.

In the application theme, in the `tab` object,
`background` and `unfocusedBackground`
is used to define the background color for focused and unfocused tabs.

In the profile settings, there is the `tabColor` setting.
This only provides the possibility to define a single color,
which is automatically converted by the program
into two different shades for focused and unfocused.
This setting overrides the background defined in the application theme.
This setting can be defined either in the profile defaults,
or it can be defined in individual profiles,
in which case it only overrides the color for tabs of that profile.

See [Github - Windows Terminal - Issue #771][terminal-issue-tab-contrast]
and [Github - Windows Terminal - Issue #1337][terminal-issue-tab-color]
for more info.

#### Changing the order of profiles

This can only be done via the settings JSON file, not via the settings GUI.

In the settings JSON file,
in `profiles` -> `list`, move the items to the desired order.

See [Github - Windows Terminal - Issue #8914][terminal-issue-profile-reordering]
for more info.

#### Vertical tabs

There is currently no support for vertical tabs.

See [Github - Windows Terminal - Issue #835][terminal-issue-vertical-tabs]
for more info.

#### Example

Here is an example of a Windows Terminal settings JSON file.

```json
{
  // ... other items ...
  "profiles": 
    {
        "defaults": 
        {
            "antialiasingMode": "cleartype",
            "colorScheme": "Eighties",
            "cursorShape": "bar",
            "font": 
            {
                "face": "Hack Nerd Font Mono",
                "size": 11
            }
        },
        "list": 
        [
            {
                "commandline": "C:\\\\Program Files\\\\PowerShell\\\\7\\\\pwsh.exe -NoLogo",
                "guid": "{574e775e-4f2a-5b96-ac1e-a2962a402336}",
                "hidden": false,
                "name": "PowerShell",
                "source": "Windows.Terminal.PowershellCore"
            },
            {
                "commandline": "%SystemRoot%\\\\System32\\\\WindowsPowerShell\\\\v1.0\\\\powershell.exe -NoLogo",
                "guid": "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}",
                "hidden": false,
                "name": "Windows PowerShell"
            },
            {
                "guid": "{51855cb2-8cce-5362-8f54-464b92b32386}",
                "hidden": false,
                "name": "Ubuntu",
                "source": "CanonicalGroupLimited.Ubuntu_79rhkp1fndgsc"
            },
            {
                "guid": "{0caa0dad-35be-5f56-a8ff-afceeeaa6101}",
                "hidden": false,
                "name": "Command Prompt"
            },
            {
                "guid": "{b453ae62-4e3d-5e58-b989-0a998ec441b8}",
                "hidden": false,
                "name": "Azure Cloud Shell",
                "source": "Windows.Terminal.Azure"
            }
        ]
    },
    "schemes": 
    [
        {
            "background": "#2D2D2D",
            "black": "#2D2D2D",
            "blue": "#6699CC",
            "brightBlack": "#747369",
            "brightBlue": "#6699CC",
            "brightCyan": "#66CCCC",
            "brightGreen": "#99CC99",
            "brightPurple": "#CC99CC",
            "brightRed": "#F2777A",
            "brightWhite": "#F2F0EC",
            "brightYellow": "#FFCC66",
            "cursorColor": "#D3D0C8",
            "cyan": "#66CCCC",
            "foreground": "#D3D0C8",
            "green": "#99CC99",
            "name": "Eighties",
            "purple": "#CC99CC",
            "red": "#F2777A",
            "selectionBackground": "#515151",
            "white": "#D3D0C8",
            "yellow": "#FFCC66"
        }
    ],
    "theme": "Custom",
    "themes": 
    [
        {
            "name": "Custom",
            "tab": 
            {
                "background": "terminalBackground",
                "iconStyle": "default",
                "showCloseButton": "never",
                "unfocusedBackground": "#1D1D1DFF"
            }
        }
    ]
}
```


---


## PowerShell Versions and Editions

PowerShell has two different Editions.
Desktop edition is older, and Core edition is newer.
Overall, they are not vastly different products,
they have the same general goals and scope.
However, there are significant differences in the PowerShell language itself.

PowerShell Desktop edition version 5.1 is the default on Windows 11.
It is very mature and stable, and works fine.
It is currently in maintenance mode,
and will not get any new versions or features.

PowerShell Core edition is a newer thing,
it does not come installed by default on Windows 10 or 11.
It has already had two new major versions, version 6 and version 7,
and it is being actively developed.
It contains plenty of new features,
and it aims to be backwards compatible with PowerShell 5.1,
but it is not fully compatible yet.
It is also cross-platform, it is available for Windows, Linux, and MacOS,
which seems to generate some amount of shock in some people.

Read more about the differences between these versions at
[Differences between Windows PowerShell 5.1 and PowerShell 7.x
][powershell-differences-5-7]
and [Migrating from Windows PowerShell 5.1 to PowerShell 7
][powershell-migrating-5-7].

#### Recommended PowerShell version

For someone who is an IT professional,
it would probably be recommended to install the latest version of PowerShell Core.  
For someone who is a beginner, or casual user,
it should be fine to remain on PowerShell Desktop 5.1, for the time being.  
I am using Windows 11 with PowerShell Core 7.5.
However, this article is useful for people running PowerShell Desktop 5.1 as well.

#### Checking current PowerShell version

To check which version is currently running, use this command.

```powershell
echo $PSVersionTable
```

#### Installing PowerShell Core

To install a newer version of PowerShell, follow the
[Installing PowerShell on Windows][microsoft-powershell-installing-windows]
documentation for the latest version.
The Winget method is probably the simplest and most developer friendly method.

PowerShell Core edition is designed to coexist with PowerShell Desktop edition.
It has a separate installation path, program name, icon, module path, profile path, etc.

When installed, it is added to the Start Menu with the name `PowerShell 7`,
and it is added to Windows Terminal as a profile with the name `PowerShell`,
and it has an icon that is a bit darker than the older version.

<Image
  src="/windows-terminal-powershell-config-guide/powershell-versions.png"
  --max-width="100%"
/>


---


## PowerShell configuration

Shell scripting is a large and complex topic.
This sections is a "how I do it",
not an "ultimate guide to everything you need to know".

See the page [about_PowerShell_exe][powershell-about]
for a list of all command line options.
When trying to open other versions of that page, such as 7.5,
it redirects to the 5.1 version.
I assume that means that the CLI has not changed at all between these versions.

#### Disable the logo

By default, PowerShell prints out somewhere around
one to five lines of text every time it starts.
To disable this, add the `-NoLogo` parameter to the executable.
This applies to both Desktop and Core editions.

This is configured at the profile level in the Windows Terminal settings.
The setting is called `Command line` in the GUI,
and `commandline` in the settings JSON file.

#### PowerShell profile

Each Windows user has their own profile file,
where they can add their personal customization,
by editing the file with a code editor.
It is a PowerShell script file that is loaded automatically every time PowerShell starts
(unless it is started with the `-NoProfile` command line option).

#### Profile path

To get the current path to the profile script file, use this command.

```powershell
echo $PROFILE
```

For PowerShell Desktop 5.1, it should be this.

```
C:\\Users\\Username\\Documents\\WindowsPowerShell\\Microsoft.PowerShell_profile.ps1
```

For PowerShell Core 7.5, it should be this.

```
C:\\Users\\Username\\Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1
```

#### Editing mode

Powershell supports different editing modes.
For users with a Unix background,
it may be desirable to switch to the Emacs editing mode.
This changes various keyboard shortcuts.
For example, `Ctrl+d` will exit the session,
and `Ctrl+a` and `Ctrl+e` will move the cursors to the beginning and end of the line.  

Read more about `-EditMode` and other parameters
at [Set-PSReadLineOption][powershell-set-psreadlineoption].

To use the Emacs edit mode, add this to your PowerShell profile.

```powershell
Set-PSReadlineOption -EditMode Emacs
```

#### Keyboard shortcuts

It is possible to add custom keyboard shortcuts.

For example, if you want to be able to exit the shell session by pressing `Ctrl+d`,
without switching to the Emacs editing mode,
then add the following to your PowerShell profile.

```powershell
Set-PSReadlineKeyHandler -Key Ctrl+d -Function ViExit
```

#### Aliases

An alias is a simple mapping between one command and another.

For example, to make `g` be an alias to `git`,
add the following to your PowerShell profile.

```powershell
Set-Alias -Name g -Value git
```

It is also possible to create functions, to perform more complex tasks.
Functions can be called just like commands, by typing them as input in the shell prompt.

For example, to create a function that is similar to `pwd`,
but only outputs the actual path, and not the unnecessary fluff around it,
add the following to your PowerShell profile.

```powershell
function p {
  Write-Output "$(Get-Location)"
}
```

#### Custom prompt

To customize the leading characters that are printed on every input prompt,
define the `prompt` function in your PowerShell profile.

For example, this code will set the prompt to be a single `>` character.

```powershell
function prompt {
  ">"
}
```

Here is a more advanced example,
that uses Console [control characters][console-virtual-terminal-sequences]
and [24 bit color][console-24-bit-color].
See also [Powershell Special Characters][powershell-special-characters].

```powershell
function prompt {
  function esc($params) {
    [char]27 + "[" + $params + "m"
  }

  $(esc "38;5;214") + ">" + $(esc "0") + " " 
}
```

The `esc` function creates an escape character sequence.  
The first call to `esc` sets the color to some shade of orange.
`38` means that it "Applies extended color value to the foreground".
`5` means that the next value is an index from the 88 or 256 color table.
`214` is the desired color in the 256 color table.
This color is applied to the `>` character.  
The second call to `esc` uses `0` to reset all attributes back to default state,
so that all text that comes after is unaffected.

#### Unicode / UTF-8

With PowerShell Core 7.5, Unicode works well out of the box.

With PowerShell Desktop 5.1,
Unicode is not enabled by default,
and there are two things required to make it work.

See [this StackOverflow answer][stackoverflow-powershell-unicode]
and [this StackOverflow answer][stackoverflow-system-locale-unicode]
and [`$OutputEncoding` in PowerShell 5.1][powershell-5-outputencoding]
for more info.

Enable unicode support in the system locale in Windows at:
Settings ->
Time & language ->
Language & Region ->
Administrative language settings ->
Administrative ->
Change system locale ->
Beta: Use Unicode UTF-8 for worldwide language support.  

Add the following to the PowerShell profile

```powershell
$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding
```



[microsoft-wsl-about]: https://learn.microsoft.com/en-us/windows/wsl/about
[windows-command-line-history]: https://devblogs.microsoft.com/commandline/windows-command-line-backgrounder/
[microsoft-store-windows-terminal]: https://apps.microsoft.com/detail/9n0dx20hk701?hl=en-US&gl=US

[tabby]: https://tabby.sh/
[waveterm]: https://www.waveterm.dev/
[contour-terminal]: https://contour-terminal.org/
[fluent-terminal]: https://github.com/felixse/FluentTerminal
[ghostty]: https://ghostty.org/
[hyper]: https://hyper.is/
[wezterm]: https://wezterm.org/
[alacritty]: https://alacritty.org/
[cmder]: https://cmder.app/
[conemu]: https://conemu.github.io/

[font-hack]: https://github.com/source-foundry/Hack
[nerdfonts]: https://www.nerdfonts.com/

[starship]: https://starship.rs/
[oh-my-posh]: https://ohmyposh.dev/

[colortest-linux]: https://askubuntu.com/a/396569
[colortest-windows]: https://stackoverflow.com/a/41954792

[base16-windows-terminal]: https://github.com/wuqs-net/base16-windows-terminal

[terminal-overview]: https://learn.microsoft.com/en-us/windows/terminal/
[terminal-themes]: https://learn.microsoft.com/en-us/windows/terminal/customize-settings/themes

[microsoft-powershell-installing-windows]: https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows?view=powershell-7.5

[terminal-issue-tab-contrast]: https://github.com/microsoft/terminal/issues/771
[terminal-issue-profile-reordering]: https://github.com/microsoft/terminal/issues/8914
[terminal-issue-vertical-tabs]: https://github.com/microsoft/terminal/issues/835
[terminal-issue-tab-color]: https://github.com/microsoft/terminal/issues/1337

[powershell-differences-5-7]: https://learn.microsoft.com/en-us/powershell/scripting/whats-new/differences-from-windows-powershell?view=powershell-7.5
[powershell-migrating-5-7]: https://learn.microsoft.com/en-us/powershell/scripting/whats-new/migrating-from-windows-powershell-51-to-powershell-7?view=powershell-7.5
[powershell-about]: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1

[powershell-set-psreadlineoption]: https://learn.microsoft.com/en-us/powershell/module/psreadline/set-psreadlineoption?view=powershell-7.5
[powershell-set-psreadlinekeyhandler]: https://learn.microsoft.com/en-us/powershell/module/psreadline/set-psreadlinekeyhandler?view=powershell-7.5
[powershell-prompt]: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_prompts?view=powershell-7.5
[powershell-special-characters]: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_special_characters?view=powershell-7.5
[powershell-5-outputencoding]: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_preference_variables?view=powershell-5.1#outputencoding

[console-virtual-terminal-sequences]: https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences
[console-24-bit-color]: https://devblogs.microsoft.com/commandline/24-bit-color-in-the-windows-console/

[stackoverflow-powershell-unicode]: https://stackoverflow.com/questions/49476326/displaying-unicode-in-powershell/49481797#49481797
[stackoverflow-system-locale-unicode]: https://stackoverflow.com/questions/57131654/using-utf-8-encoding-chcp-65001-in-command-prompt-windows-powershell-window/57134096#57134096
