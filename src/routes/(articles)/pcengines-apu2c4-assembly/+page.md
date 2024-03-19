---
url: "pcengines-apu2c4-assembly"
title: "PC Engines APU2C4 Assembly"
date: 2016-06-05 23:23:30 +0200
tags:
  - "Hardware"
  - "Networking"
---

<script>
	import Image from "$lib/Image.svelte";
</script>

So, I decided I ~~need~~ want a new router. Partly because the support ended for my current Netgear router, and because I always wanted a good reason to run some BSD so I could learn more about it and networking in general.

<!-- more -->

I researched a bunch of boards with Intel Atom / Celeron CPU's at first. But finally decided on a [PC Engines apu2c4](http://pcengines.ch/apu2c4.htm), for some not too shabby reasons:

- This board is supposed to work perfectly with pfSense.
- Designed for passive cooling.
- Intel NICs help offload the CPU more than Realtek NICs.
- The Jaguar CPU should be able to push several hundred mega bytes per second.
- It also has AES-NI which is nice if I ever want to do VPN.
- AMD <i class="fa fa-heart fa-fw"></i> Open Source.

The only downside I can see:

- No graphics chip, requires you to use a serial terminal over null modem cable.

<Image src="/pcengines-apu2c4-assembly/unpack1.jpg" />
<Image src="/pcengines-apu2c4-assembly/unpack2.jpg" />

The board comes with a cooling plate included. This is a passive cooling that is designed specifically for their case. It's really neat how you just stick it to the bottom of the case, so the heat can dissipate through the case. Just hope that disassembly is never needed.

The case comes with all the screws and even rubber feet - nice! =)

Close ups of the board:

<Image src="/pcengines-apu2c4-assembly/board-front.jpg" />
<Image src="/pcengines-apu2c4-assembly/board-back.jpg" />


I do not have any pictures of me assembling the cooling, as this was quite fiddly. But PC Engines provides [very good instructions with pictures](http://pcengines.ch/apucool.htm).

Here it is with all the internal parts assembled in the case:

<Image src="/pcengines-apu2c4-assembly/assembled.jpg" />

This thing is definitely sturdy.
No more cheap and shiny plastic products from consumer brands!

Here is what the final product looks like:

<Image src="/pcengines-apu2c4-assembly/done-front.jpg" />
<Image src="/pcengines-apu2c4-assembly/done-back.jpg" />

To connect to this board and install an OS, a null modem cable and a serial terminal client is required.

In order for the serial terminal to work properly, I applied the following settings in putty:

- Speed (baud): `115200`
- Data bits: `8`
- Stop bits: `1`
- Parity: `None`
- Flow control: `None`

<!-- {{% img-link url="putty.png" %}} -->

Most of these settings are [documented by pfSense](https://doc.pfsense.org/index.php/Connecting_to_the_Serial_Console). But one thing that is not mentioned there is the setting for Flow control. The default value for Flow control in putty is `XON/XOFF`, for me this prevents the keyboard from working in the terminal. Setting it to `None` [makes the keyboard work](https://forum.pfsense.org/index.php?topic=78744.msg507937#msg507937).

Hopefully there will not be much need to use the serial port after installing the OS. Although at some point I will probably want to flash a new BIOS, since they keep developing it quite a lot after releasing the board.

Some additional reading by pcengines: [http://pcengines.ch/howto.htm](http://pcengines.ch/howto.htm).
