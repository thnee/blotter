---
url: "cloud-network-design"
title: "Cloud network design"
date: "2021-05-16"
tags:
  - "System Administration"
  - "Cloud Platforms"
  - "Networking"
---

Cloud VPCs come with some subnet configuration predefined.
It is usually best to delete the default VPCs, and define subnets yourself.
This article contains an overview of how to design subnets in the cloud,
and gives concrete examples to use in real environments.

<!--more-->



## Preface

Cloud platforms like GCP and AWS are great.
They allow small companies to get started farily easily,
yet also scale quite far.

But they also come with new trade-offs.
Stuff that was previously handled by the gnomes living in the vents of your data center
provider now bubbles up to the surface and becomes your problem.

Cloud platforms are fundamentally DIY,
there is no architect included that will design a solution for you.
But the cloud platform must still cater to a wide audience,
which means there are a lot of knobs that may or may not require turning
in your particular case.

One of those things is the VPC and subnet configuration.



## Background

In GCP and AWS there are default VPCs and default subnets created automatically.
It can be tempting to just spin up a bunch of services in these default networks.
This might work fine for some time, but may eventually lead to problems.

At some point you are going to want to scale out in one way or another.
And you may need to integrate your network with other networks.
Here is the thing: once you have built up a system for a couple of years,
changing the subnet configuration later down the road can be close to impossible.

The network is one of the most fundamental building blocks in any cloud based platform,
yet is often completely overlooked when getting started.
I suspect this is partly because a lot of people find it boring,
and also because quite a few developers don't really know how to do subnet design.



## Scalability

There are different types of scalability.
Scalability is often mistaken as only relating to raw performance,
as in "app has gained more users, we need to add more machines",
but that's the easy part really.
Geographical and organizational scalability are actually much more common problems,
and trickier to solve, yet often overlooked.

First of all, any cloud setup needs to be spreading its resources
across availability zones. This is absolutely necessary to achieve basic redundancy.
And if an app has a global user base, there is typically a need to add
resources in at least a few different regions, in order to be closer to the customers.

In addition to this, there may also be business / legal requirements stating that there
has to be regional redundancy.
In the most extreme cases there can even be requirements for cross-platform redundancy.

And depending on the complexity of the organization,
it may be necessary to divide things by product, business unit, team,
or whatever company division an organization decides to use.

And last but not least,
most products / teams will usually need to have multiple environments.
Either for internal purposes, to be able to test and stage things before going live.
Or because there are multiple customers that require isolated environments.
This may also include a shared environment which hosts shared services used by all
the other concrete environments.



## Interoperability

Scalability is not the only thing that may require network division.
There may be requirements to integrate with third party
systems on the network layer.
This usually happens in the form of VPC peering or VPN connections.

These kind of requirements are pretty industry-dependent,
usually found in for example the finance industry.

But even if you are not operating in the finance industry,
it is still a good idea to be prepared for this kind of activity,
because if it comes and you did not design your VPC+subnets corretly,
it can be a nightmare.

This also ties into the environments mentioned in the previous section,
there needs to be interoperability between those environments.
Typically, at minimum, there needs to be some connection between
the shared environment and all the concrete environments,
but there may also be a need to connect between concrete environments directly.



## Subnet and cloud basics

This article is not intended to be a complete subnet or cloud tutorial.  
It requires fundamental knowledge of the following kind of stuff.

- [Subnetwork][subnetwork]
- [CIDR][cidr]
- [Private Address Space][private-ranges]
- [GCP Regions and Zones][gcp-regions-and-zones]
- [AWS Regions and Zones][aws-regions-and-zones]



## Design overview

- Pick a private network range with as much space as possible,
so that would be the `10.0.0.0/8` range.
- Divide that range fairly evenly based on the organizational needs.
- Maintain a good level of symmetry in the design, so that it's easy to understand,
  and easy to automate with tools like Terraform.

We also want to avoid overlap as much as possible, in order to ensure interoperability.
If you know that product / environment X never needs to talk to product / environment Y,
then technically you could use the same VPC+subnet ranges in both.
But it really is best to have a separate range for every VPC anyway,
then you know that you always have the ability to
peer any environment with any other environment if the need arises.
And if the network design is done correctly from the start,
there is plenty of space to do so, unless your organization is absolutely gigantic.

A major difference between cloud networks and traditional datacenter networks is
how the firewall is implemented. In a traditional datacenter,
the firewall is typically a big central machine that all traffic goes through.
But in a cloud network, there is no big central machine,
instead firewall rules (and network access control lists)
are applied directly on each individual machine instance.

The implication of the firewall implementation is very important.
With a central firewall, you basically have to have a separate subnet for every
application / service, in order to ensure proper segmentation on the network layer.
This inevitably leads to a lot of overlap due to network space limitation,
and a lot of subnets to keep track of.
But with a cloud firewall the network access control
takes place on each individual machine instance,
which means that various applications / services can run the same VPC and subnet.



## Design examples

Allright, enough with the talking, let's look at some concrete examples.

<!-- Use my [Subnet calculator][subnet-calculator]
for an interactive tool where you can play around with the network and netmask
to get an even better understanding of what is happening. -->

<div class="note note-info">
These are real world examples that I have designed and used myself.<br>
They are intended as general purpose designs
that should work for any arbitrary organization.<br>
Even so, that does not mean you should blindly copy these designs,
every organization may have its own special needs.
</div>

### AWS

AWS has some arbitrary limitations:

- It's not just Subnets that have a netmask, VPCs require them too.
- VPCs must be sliced at `/16` or smaller.
  (Smaller network size meaning a larger netmask, e.g. `/17` or `/20`).
- Subnets are created per Availability Zone, not per Region.


This means that we can't actually utilize a `/8` range completely freely,
but that's ok because we really do want to allocate some space for multiple VPCs anyway.

But it also means that we will end up wasting more space,
in order to maintain some sanity and symmetry.

If our base network is sliced at `/8` and we create our VPCs sliced at `/16`,
that means there are 8 bits (256 possible values)
available in the second byte of the network address.

That means we could have a list of VPCs such as this.

Network | Description
--- | --- |
`10.0.0.0/16` | Shared environment
`10.1.0.0/16` | Business unit A - Development environment
`10.2.0.0/16` | Business unit A - Staging environment
`10.3.0.0/16` | Business unit A - Production environment
`10.4.0.0/16` | Business unit B - Development environment
`10.5.0.0/16` | Business unit B - Staging environment
`10.6.0.0/16` | Business unit B - Production environment
`10.255.0.0/16` | Integration services

If we slice VPCs at `/16`, that means there are 16 bits (65536 possible values)
available in the third and fourth bytes of the network address.

So let's slice our subnets at `/22`.
This gives us 6 bits (64 possible values) for subnets per VPC,
and 10 bits (1024 possible values) for hosts per subnet.

So using the `10.3.0.0/16` VPC as an example,
that means we could have a list of subnets such as this.

Network | Availability Zone | Description
--- | --- | ---
`10.3.0.0/22`  | `eu-central-1a` | General purpose - Frankfurt A - Private
`10.3.4.0/22`  | `eu-central-1b` | General purpose - Frankfurt B - Private
`10.3.8.0/22`  | `eu-central-1c` | General purpose - Frankfurt C - Private
`10.3.12.0/22` | `eu-central-1a` | General purpose - Frankfurt A - Public
`10.3.16.0/22` | `eu-central-1b` | General purpose - Frankfurt B - Public
`10.3.20.0/22` | `eu-central-1c` | General purpose - Frankfurt C - Public
`10.3.24.0/22` | `eu-west-1a`    | General purpose - Ireland A - Private
`10.3.28.0/22` | `eu-west-1b`    | General purpose - Ireland B - Private
`10.3.32.0/22` | `eu-west-1c`    | General purpose - Ireland C - Private
`10.3.36.0/22` | `eu-west-1a`    | General purpose - Ireland A - Public
`10.3.40.0/22` | `eu-west-1b`    | General purpose - Ireland B - Public
`10.3.44.0/22` | `eu-west-1c`    | General purpose - Ireland C - Public

<!-- The name here consists of `<purpose>-<availability_zone>-<access_level>`,
where `purpose: main` means that it's general purpose and will be shared by all projects
running in this VPC, and `access_level: public / private` defines
if this is a public or private subnet
(i.e. whether it can be called into from the internet).
 -->
The idea is that 64 subnets per VPC should cover the amount of
regions and availability zones we
may need to scale out to, assuming that we have two subnets (public and private) per AZ.

Following cloud best practices,
we do not create separate subnets for each purpose / project / service,
instead we leave a lot of room to grow to more regions and availability zones.

### GCP

GCP does not have the same arbitrary limitations as AWS,
it offers a much more modern and globalized network stack.
It allows for a more open and flexible design, with better network space utilization.

When it comes to VPCs, you don't need to provide a netmask (a.k.a. CIDR range) at all,
and you are free to utilize a `/8` base network to create subnets of any size.

Furthermore subnets in GCP are a regional resource that spans across availability zones.
Again, this is different from AWS where subnets are limited to one availability zone.

So, while we still want to follow the same general design principles —
and the base network of `/8` is still the same size —
the additional freedom in GCP allows for wider margins and more elbow-room.
Which means that we can make our subnets slightly larger.
(Larger network size meaning a smaller netmask).

So let's slice the subnets at `/20`.
Then we have taken the 24 available bits and divided them exactly in half.
This gives us 12 bits (4096 possible values) for number of networks,
and 12 bits (4096 possible values) for number of hosts per network.

These networks can be freely distributed per
product / region  / purpose / access level, as needed.

That means we could have a list of subnets such as this.

Network | Project | VPC | Region | Description
--- | --- | --- | --- | ---
`10.0.0.0/20`   | `shared-services`       | `main` | `europe-west1`  | Shared services - Belgium
`10.1.0.0/20`   | `product-a-development` | `main` | `europe-west1`  | Product A - Development environment - Belgium
`10.2.0.0/20`   | `product-a-staging`     | `main` | `europe-west1`  | Product A - Staging environment - Belgium
`10.3.0.0/20`   | `product-a-production`  | `main` | `europe-west1`  | Product A - Production environment - Belgium
`10.3.16.0/20`  | `product-a-production`  | `main` | `europe-north1` | Product A - Production environment - Finland
`10.3.32.0/20`  | `product-a-production`  | `main` | `asia-east2`    | Product A - Production environment - Hong Kong
`10.4.0.0/20`   | `product-b-development` | `main` | `europe-west1`  | Product B - Development environment - Belgium
`10.5.0.0/20`   | `product-b-staging`     | `main` | `europe-west1`  | Product B - Staging environment - Belgium
`10.6.0.0/20`   | `product-b-production`  | `main` | `europe-west1`  | Product B - Production environment - Belgium
`10.6.16.0/20`  | `product-b-production`  | `main` | `europe-north1` | Product B - Production environment - Finland
`10.6.32.0/20`  | `product-b-production`  | `main` | `asia-east2`    | Product B - Production environment - Hong Kong
`10.255.0.0/20` | `integration-services`  | `main` | `europe-west1`  | Integration services - Belgium

Typically, you also want Google APIs Service Networking,
for example when running a database in Cloud SQL.

We could allocate the last subnet in each major second-byte number for this.
So using the `10.1.0.0/20` network as an example,
we could dedicate `10.240.0.0/20` for Google APIs Service Networking Connection.



[subnetwork]: https://en.wikipedia.org/wiki/Subnetwork
[cidr]: https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing
[private-ranges]: https://www.arin.net/reference/research/statistics/address_filters/
[gcp-regions-and-zones]: https://cloud.google.com/compute/docs/regions-zones
[aws-regions-and-zones]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html
[subnet-calculator]: /subnet-calculator/
